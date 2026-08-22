package handlers

import (
	"backend/db"
	"log"

	"github.com/gofiber/fiber/v2"
)

func ViewJob(c *fiber.Ctx) error {
	jobId := c.Query("jobId")

	log.Println("Job", jobId)

	type Job struct {
		Title           string `json:"title"`
		Company         string `json:"company"`
		Location        string `json:"location"`
		WorkType        string `json:"work_type"`
		ExperienceLevel string `json:"experience_level"`
		Salary          string `json:"salary"`
		Description     string `json:"description"`
		PostedAt        string `json:"posted_at"`
	}

	if jobId == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "jobId is required",
		})
	}

	var job Job

	err := db.DB.QueryRow(`SELECT title, company, location, work_type, experience_level, salary, description, posted_at 
		from jobs where job_id=$1`,
		jobId).Scan(
		&job.Title,
		&job.Company,
		&job.Location,
		&job.WorkType,
		&job.ExperienceLevel,
		&job.Salary,
		&job.Description,
		&job.PostedAt,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(job)
}
