package handlers

import (
	"backend/db"
	"backend/sessions"

	"github.com/gofiber/fiber/v2"
)

func DeleteSavedjobs(c *fiber.Ctx) error {
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
		DELETE FROM user_saved_jobs WHERE user_email = $1 and job_id = $2
	`,
		email,
		jobId)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "deleted"})
}
