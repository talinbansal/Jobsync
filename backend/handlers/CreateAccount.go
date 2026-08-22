package handlers

import (
	"backend/db"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

func CreateAccount(c *fiber.Ctx) error {
	type Request struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Password  string `json:"password"`
	}

	var body Request

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "Invalid request body",
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": "Password hashing failed",
		})
	}

	_, err = db.DB.Exec( //use QueryRow + RETURNING if we need userId back
		"INSERT INTO users (first_name, last_name, email, password, created_at, setup) VALUES ($1,$2,NOW(),$3)", //NOW(): postgres handles timestamp
		body.FirstName,
		body.LastName,
		body.Email,
		hashedPassword,
		false,
	)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "User created",
	})
}
