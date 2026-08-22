package handlers

import (
	"backend/db"
	"backend/sessions"

	"github.com/gofiber/fiber/v2"
)

func FetchPoints(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var points int

	err := db.DB.QueryRow(
		`SELECT total_points FROM users WHERE email=$1`,
		email,
	).Scan(&points)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"points": points,
	})
}
