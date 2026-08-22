package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"backend/redis"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type JobMessage struct {
	ApplicationId int    `json:"applicationId"` // id of job_applications table
	JobId         string `json:"jobId"`
}

type RMessage struct {
	Status  string `json:"status"`
	JobID   string `json:"jobId"`
	JobName string `json:"jobName"`
	Email   string `json:"email"`
}

func Start(db *sql.DB) {

	ctx := context.TODO()

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		panic(err)
	}

	client := sqs.NewFromConfig(cfg)

	queueURL := os.Getenv("SQS_URL")

	fmt.Println("SQS Worker started... waiting for messages")

	// Worker keeps Polling SQS
	for {
		output, err := client.ReceiveMessage(ctx, &sqs.ReceiveMessageInput{
			QueueUrl:            aws.String(queueURL),
			MaxNumberOfMessages: 1,
			WaitTimeSeconds:     20,
		})

		if err != nil {
			fmt.Println("SQS receive error:", err)
			time.Sleep(2 * time.Second)
			continue
		}

		for _, msg := range output.Messages {
			var jobMsg JobMessage

			err := json.Unmarshal([]byte(*msg.Body), &jobMsg)
			if err != nil {
				fmt.Println("bad message:", err)
				continue
			}

			// Idempotency Check
			var (
				idempotencyCheck string
				Status           string
			)

			err = db.QueryRow(`
				SELECT ja.analysis_status, jap.status
				FROM job_analysis ja JOIN job_applications jap
					ON jap.id = ja.application_id
				WHERE ja.application_id = $1
			`,
				jobMsg.ApplicationId).Scan(
				&idempotencyCheck,
				&Status,
			)

			if err != nil {
				fmt.Println("Idempotency check failed:", err)
				continue
			}

			if idempotencyCheck == "Rejected" || idempotencyCheck == "Interview" {
				if Status != idempotencyCheck {
					_, err = db.Exec(`
						UPDATE job_applications 
						SET status = $1 WHERE id = $2
					`,
						idempotencyCheck,
						jobMsg.ApplicationId,
					)

					if err != nil {
						fmt.Println("job applications update error:", err)
						continue
					}
				}

				fmt.Println("Updating SQS...")
				// Delete message if Application already processed
				_, err = client.DeleteMessage(ctx, &sqs.DeleteMessageInput{
					QueueUrl:      aws.String(queueURL),
					ReceiptHandle: msg.ReceiptHandle,
				})

				if err != nil {
					fmt.Println("delete error:", err)
				}

				continue
			}

			_, err = db.Exec(`
				UPDATE job_analysis 
				SET analysis_status = $1 
				WHERE application_id = $2
			`,
				"In Review",
				jobMsg.ApplicationId)

			if err != nil {
				fmt.Println("DB lock error:", err)
				continue
			}

			var (
				jobName   string
				userEmail string
			)

			err = db.QueryRow(`
				WITH updated_application AS (
					UPDATE job_applications
					SET 
						status = $1
					WHERE id = $2
					RETURNING job_id, user_email
				)
				SELECT 
					j.title,
					ua.user_email
				FROM updated_application ua
				JOIN jobs j
				ON j.job_id = ua.job_id;
			`,
				"In Review",
				jobMsg.ApplicationId).Scan(&jobName, &userEmail)

			if err != nil {
				fmt.Println("Job Apps DB lock error:", err)
				continue
			}

			// Create Message a s a struct
			RedisMsg := RMessage{
				Status:  "In Review",
				JobID:   jobMsg.JobId,
				JobName: jobName,
				Email:   userEmail,
			}

			// Marshal it into JSON rather than doing it manually
			payload, err := json.Marshal(RedisMsg)
			if err != nil {
				fmt.Println("unable to marshal message:", err)
			}

			// Send update via web sockets to frontend
			redis.Client.Publish(
				redis.Ctx,
				"notifications",
				payload,
			)

			// Fetch JobData
			var resumeURL, coverURL string

			err = db.QueryRow(`
				SELECT resume_url, cover_letter_url
				FROM job_applications
				WHERE id = $1
			`,
				jobMsg.ApplicationId).Scan(&resumeURL, &coverURL)

			if err != nil {
				fmt.Println("fetch error:", err)
				continue
			}

			resumeCh := make(chan string)
			coverCh := make(chan string)

			fmt.Println("Reading pdf...")
			go func() {
				text, _ := ReadResume(resumeURL)
				resumeCh <- text // Channel Send
			}()

			go func() {
				text, _ := ReadCoverLetter(coverURL)
				coverCh <- text
			}()

			resume := <-resumeCh // Channel Receive
			coverLetter := <-coverCh

			fmt.Println("Starting Processing...")
			verdict, _ := process(jobMsg.JobId, resume, coverLetter)

			fmt.Println("Updating db...")
			_, err = db.Exec(`
				UPDATE job_analysis 
				SET analysis_status = $1, 
				ai_match_score = $2, 
				ai_feedback = $3
				WHERE job_id = $4
			`,
				verdict.Decision,
				verdict.MatchScore,
				verdict.Feedback,
				jobMsg.JobId,
			)

			if err != nil {
				fmt.Println("final update error:", err)
			}

			_, err = db.Exec(`
				UPDATE job_applications 
				SET status = $1 WHERE id = $2
			`,
				verdict.Decision,
				jobMsg.ApplicationId,
			)

			if err != nil {
				fmt.Println("job applications update error:", err)
				continue
			}

			// Create Message a s a struct
			RedisMsg2 := RMessage{
				Status:  verdict.Decision,
				JobID:   jobMsg.JobId,
				JobName: jobName,
				Email:   userEmail,
			}

			// Marshal it into JSON rather than doing it manually
			finalPayload, err := json.Marshal(RedisMsg2)
			if err != nil {
				fmt.Println("unable to marshal message:", err)
			}

			// Send update via web sockets to frontend
			redis.Client.Publish(
				redis.Ctx,
				"notifications",
				finalPayload,
			)

			fmt.Println("Updating SQS...")
			// Delete message only after success
			_, err = client.DeleteMessage(ctx, &sqs.DeleteMessageInput{
				QueueUrl:      aws.String(queueURL),
				ReceiptHandle: msg.ReceiptHandle,
			})

			if err != nil {
				fmt.Println("delete error:", err)
			}
		}
	}
}
