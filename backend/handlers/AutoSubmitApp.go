package handlers

import (
	"backend/db"
	"backend/sessions"
	"database/sql"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func AutoSubmitApp(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	type Request struct {
		Resume      string `json:"resumeURL"`
		CoverLetter string `json:"coverLetterURL"`
		Portfolio   string `json:"portfolioLink"`
		Github      string `json:"githubLink"`
		JobId       string `json:"jobId"`
	}

	var body Request

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "Invalid request body",
		})
	}

	tx, err := db.DB.Begin()

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to start transaction",
		})
	}
	defer tx.Rollback()

	var applicationID int

	err = tx.QueryRow(`
	INSERT INTO job_applications 
	(job_id, user_email, resume_url, cover_letter_url, 
	portfolio_url, github_url, status, applied_at)
	VALUES($1, $2, $3, $4, $5, $6, $7, NOW())
	ON CONFLICT (job_id, user_email) DO NOTHING
	RETURNING id`,
		body.JobId,
		email,
		body.Resume,
		body.CoverLetter,
		body.Portfolio,
		body.Github,
		"Applied",
	).Scan(&applicationID)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(409).JSON(fiber.Map{
				"error": "You have already applied to this job",
			})
		}

		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	_, err = tx.Exec(`
		INSERT INTO job_analysis
		(application_id, job_id, user_email, analysis_status)
		VALUES($1, $2, $3, $4)
		`,
		applicationID,
		body.JobId,
		email,
		"Pending",
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	var outboxID int // id of outbox_messages table

	err = tx.QueryRow(`
		INSERT INTO outbox_messages
			(application_id, job_id)
		VALUES($1, $2)
		RETURNING id
	`,
		applicationID,
		body.JobId,
	).Scan(&outboxID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	_, err = tx.Exec(`
		SELECT pg_notify('outbox_messages', $1)
	`, strconv.Itoa(outboxID))

	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to start transaction",
		})
	}

	return c.JSON(fiber.Map{
		"message": "success",
	})
}
