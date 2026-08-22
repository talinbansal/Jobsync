package handlers

import (
	"backend/db"
	"backend/internal"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

func Login(c *fiber.Ctx) error {

	type Request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var body Request

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "Invalid request body",
		})
	}

	var hashedPassword string

	err := db.DB.QueryRow(
		"SELECT password FROM users WHERE email=$1",
		body.Email,
	).Scan(&hashedPassword)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "User not found",
		})
	}

	// bcrypt comparison
	err = bcrypt.CompareHashAndPassword(
		[]byte(hashedPassword),
		[]byte(body.Password),
	)

	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"message": "Incorrect password",
		})
	}

	if err := internal.CreateSession(c, body.Email); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"message": "Login successful",
	})
}
