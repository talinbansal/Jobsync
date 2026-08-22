package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/lib/pq"
)

func ConnectionString() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_NAME"),
	)
}

type OutboxMessage struct {
	ApplicationId int
	JobId         string
}

func checkOutboxMessages(db *sql.DB) error {
	fmt.Println("Outbox Worker started")

	listener := pq.NewListener(
		ConnectionString(),
		10*time.Second,
		time.Minute,
		nil,
	)

	err := listener.Listen("outbox_messages")
	if err != nil {
		log.Fatal(err)
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		return err
	}

	client := sqs.NewFromConfig(cfg)

	for notif := range listener.Notify {
		log.Println("Notification:", notif.Extra)

		outboxID, err := strconv.Atoi(notif.Extra) // Extra holds the payload info like we send id
		if err != nil {
			log.Println("Invalid outbox ID:", notif.Extra)
			continue
		}

		var message OutboxMessage

		err = db.QueryRow(`
			SELECT application_id, job_id 
			FROM outbox_messages 
			WHERE id = $1
			AND processed_at IS NULL
		`,
			outboxID).Scan(
			&message.ApplicationId,
			&message.JobId,
		)

		if err != nil {
			log.Println("Failed to fetch outbox message:", err)
			continue
		}

		msg := map[string]any{
			"applicationId": message.ApplicationId,
			"jobID":         message.JobId,
		}

		msgBytes, err := json.Marshal(msg)
		if err != nil {
			log.Println("Failed to marshal message:", err)
			continue
		}

		sent := false

		for attempt := 0; attempt <= 5; attempt++ {

			delay := time.Duration(attempt+1) * time.Second

			_, err = client.SendMessage(context.Background(), &sqs.SendMessageInput{
				QueueUrl:    aws.String(os.Getenv("SQS_URL")),
				MessageBody: aws.String(string(msgBytes)),
			})

			if err != nil {
				log.Println("Failed to send message to SQS:", err)
				if attempt < 5 {
					time.Sleep(delay)
				}
				continue
			}

			log.Println("Successfully sent message to SQS")

			_, err = db.Exec(`
			UPDATE outbox_messages 
			SET processed_at = NOW() 
			WHERE id = $1
		`,
				outboxID)

			if err != nil {
				return err
			}

			sent = true
			break
		}

		if !sent {
			log.Printf("Failed to send outbox message %d after 6 attempts", outboxID)
		}
	}

	return nil
}
