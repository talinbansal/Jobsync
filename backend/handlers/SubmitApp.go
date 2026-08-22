package handlers

import (
	"backend/db"
	"backend/sessions"
	"database/sql"
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (h *AccountHandler) SubmitApp(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	portfolio := c.FormValue("portfolioLink")
	github := c.FormValue("githubLink")
	jobId := c.FormValue("jobId")

	resume, _ := c.FormFile("resume")

	files := make(map[string]string)

	if resume != nil {
		log.Println("Uploading resume:", resume.Filename)
		log.Println("EMAIL:", email)
		log.Println("FILENAME:", resume.Filename)
		log.Println("SIZE:", resume.Size)
		file, err := resume.Open()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Could not open resume",
			})
		}
		defer file.Close()

		log.Println("Starting S3 upload")
		resumeURL, err := h.S3.UploadFile(
			c.Context(),
			file,
			"appliedResumes/"+email+"/"+resume.Filename,
			resume.Header.Get("Content-Type"),
		)

		log.Println("Finished S3 upload")

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		log.Println("Uplaoded")
		files["Resume"] = resumeURL
	}

	coverLetter, _ := c.FormFile("coverLetter")

	if coverLetter != nil {
		log.Println("Uploading coverLetter:", coverLetter.Filename)
		log.Println("EMAIL:", email)
		log.Println("FILENAME:", coverLetter.Filename)
		log.Println("SIZE:", coverLetter.Size)
		file, err := coverLetter.Open()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Could not open coverLetter",
			})
		}
		defer file.Close()

		coverLetterURL, err := h.S3.UploadFile(
			c.Context(),
			file,
			"appliedCoverLetters/"+email+"/"+coverLetter.Filename,
			coverLetter.Header.Get("Content-Type"),
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		files["CoverLetter"] = coverLetterURL
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
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		ON CONFLICT (job_id, user_email) DO NOTHING
		RETURNING id`,
		jobId,
		email,
		files["Resume"],
		files["CoverLetter"],
		portfolio,
		github,
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
		jobId,
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
		jobId,
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
