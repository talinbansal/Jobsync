package handlers

import (
	"backend/db"
	"database/sql"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type Job struct {
	ID              int    `json:"id"`
	JobID           string `json:"job_id"`
	Title           string `json:"title"`
	Company         string `json:"company"`
	Location        string `json:"location"`
	WorkType        string `json:"work_type"`
	ExperienceLevel string `json:"experience_level"`
	Salary          string `json:"salary"`
	Description     string `json:"description"`
	PostedAt        string `json:"posted_at"`
}

func GetJobs(c *fiber.Ctx) error {
	limitStr := c.Query("limit")
	cursor := c.Query("cursor")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 6
	}

	var jobs []Job
	var (
		rows *sql.Rows
	)

	if cursor != "" {
		rows, err = db.DB.Query(
			`SELECT id, job_id, title, company, location, work_type, experience_level, salary, description, posted_at
			FROM jobs where posted_at < $1 order by posted_at desc limit $2`,
			cursor,
			limit+1,
		)
	} else {
		rows, err = db.DB.Query(
			`SELECT id, job_id, title, company, location, work_type, experience_level, salary, description, posted_at
			FROM jobs order by posted_at desc limit $1`,
			limit+1,
		)
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	defer rows.Close()

	for rows.Next() {
		var job Job
		err := rows.Scan(
			&job.ID,
			&job.JobID,
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
				"error": err.Error(),
			})
		}

		jobs = append(jobs, job)
	}

	hasMore := false

	if len(jobs) > limit {
		hasMore = true
		jobs = jobs[:limit] // trim extra row
	}

	nextCursor := jobs[len(jobs)-1].PostedAt

	return c.JSON(fiber.Map{
		"jobs":       jobs,
		"nextCursor": nextCursor,
		"nextPage":   hasMore,
	})

}
