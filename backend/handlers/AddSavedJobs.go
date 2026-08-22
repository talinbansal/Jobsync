package handlers

import (
	"backend/db"
	"backend/sessions"

	"github.com/gofiber/fiber/v2"
)

func AddSavedjobs(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	jobId := c.Query("jobId")

	_, err := db.DB.Exec(`
		INSERT INTO user_saved_jobs
			(job_id, user_email, saved_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_email, job_id)
		DO NOTHING
	`,
		jobId,
		email)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "added"})
}
