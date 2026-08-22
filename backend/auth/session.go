package auth

import (
	"backend/sessions"

	"github.com/gofiber/fiber/v2"
)

func CheckSession(c *fiber.Ctx) error {
	sess, err := sessions.Store.Get(c)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": "Failed to retrieve session",
		})
	}

	emailVal := sess.Get("email")

	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	return c.JSON(fiber.Map{
		"authenticated": true,
	})
}
