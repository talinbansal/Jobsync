package handlers

import (
	"backend/db"
	"backend/sessions"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
)

func GetProfileData(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	type SetupData struct {
		Resume      string `json:"resume"`
		CoverLetter string `json:"coverLetter"`
		Portfolio   string `json:"portfolio"`
		Github      string `json:"github"`
		Specifics   string `json:"specifics"`
	}

	var setup bool
	var raw string
	var points int
	var setupData SetupData

	err := db.DB.QueryRow(
		"SELECT setup FROM users WHERE email=$1",
		email,
	).Scan(&setup)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if !setup {
		return c.JSON(fiber.Map{
			"setup": false,
		})
	}

	selectErr := db.DB.QueryRow(
		"SELECT setup_data, total_points FROM users WHERE email=$1",
		email,
	).Scan(&raw, &points)

	if selectErr != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": selectErr.Error(),
		})
	}

	selectErr = json.Unmarshal([]byte(raw), &setupData)
	if selectErr != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "invalid setup_data format",
		})
	}

	return c.JSON(fiber.Map{
		"setup":        true,
		"setup_data":   setupData,
		"total_points": points,
	})
}
