package handlers

import (
	"backend/db"
	"encoding/json"
	"log"

	"github.com/gofiber/fiber/v2"
)

func (h *AccountHandler) AccountSetup(c *fiber.Ctx) error {

	points := map[string]int{
		"resume":      30,
		"coverLetter": 10,
		"github":      10,
		"portfolio":   10,
		"specifics":   40,
	}

	var totalPoints int

	setup := make(map[string]any)

	email := c.FormValue("email")
	portfolio := c.FormValue("portfolio")
	github := c.FormValue("github")
	specifics := c.FormValue("specifics")

	resume, _ := c.FormFile("resume")

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

		resumeURL, err := h.S3.UploadFile(
			c.Context(),
			file,
			"resumes/"+email+"/"+resume.Filename,
			resume.Header.Get("Content-Type"),
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		setup["resume"] = resumeURL
	}

	coverLetter, _ := c.FormFile("coverLetter")

	if coverLetter != nil {
		log.Println("Uploading cover letter:", coverLetter.Filename)
		file, err := coverLetter.Open()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Could not Open Cover Letter",
			})
		}

		defer file.Close()

		coverLetterURL, err := h.S3.UploadFile(
			c.Context(),
			file,
			"coverLetters/"+email+"/"+coverLetter.Filename,
			coverLetter.Header.Get("Content-Type"),
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		setup["coverLetter"] = coverLetterURL
	}

	if resume != nil {
		totalPoints += points["resume"]
	}

	if coverLetter != nil {
		totalPoints += points["coverLetter"]
	}

	if portfolio != "" {
		totalPoints += points["portfolio"]
	}

	if github != "" {
		totalPoints += points["github"]
	}

	if specifics != "" {
		totalPoints += points["specifics"]
	}

	setup["portfolio"] = portfolio
	setup["github"] = github
	setup["specifics"] = specifics

	setupClean, err := json.Marshal(setup)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	_, err = db.DB.Exec(
		"UPDATE users SET setup = $1, setup_data = $2, total_points = $3 WHERE email = $4",
		true,
		setupClean,
		totalPoints,
		email,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "successful"})
}
