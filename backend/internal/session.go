package internal

import (
	"backend/sessions"

	"github.com/gofiber/fiber/v2"
)

func CreateSession(c *fiber.Ctx, email string) error {
	sess, err := sessions.Store.Get(c)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Unable to fetch session",
		})
	}

	sess.Set("email", email)

	if err := sess.Save(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Unable to create session",
		})
	}

	return nil
}
