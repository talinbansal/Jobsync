package handlers

import (
	"backend/db"
	"backend/sessions"
	"database/sql"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type SavedJob struct {
	JobId string `json:"jobId"`
}

type SavedJobFull struct {
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
	SavedAt         string `json:"saved_at"`
}

func FetchSavedJobs(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)

	emailVal := sess.Get("email")
	email, ok := emailVal.(string)

	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	savedJobsPage := c.Query("saved_page")
	limitStr := c.Query("limit")
	cursor := c.Query("cursor")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 6
	}

	if savedJobsPage == "true" {
		savedJobs := make([]SavedJobFull, 0)

		var rows *sql.Rows

		if cursor != "" {
			rows, err = db.DB.Query(`
				SELECT j.*, s.saved_at
				FROM jobs j
				JOIN user_saved_jobs s
					ON j.job_id = s.job_id
				WHERE s.user_email = $1
					AND s.saved_at < $2
				ORDER BY s.saved_at DESC
				LIMIT $3 + 1
			`,
				email,
				cursor,
				limit,
			)
		} else {
			rows, err = db.DB.Query(`
				SELECT j.*, s.saved_at
				FROM jobs j
				JOIN user_saved_jobs s
					ON j.job_id = s.job_id
				WHERE s.user_email = $1
				ORDER BY s.saved_at DESC
				LIMIT $2 + 1
			`,
				email,
				limit,
			)
		}

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		defer rows.Close()

		for rows.Next() {
			var savedJob SavedJobFull

			err := rows.Scan(
				&savedJob.ID,
				&savedJob.JobID,
				&savedJob.Title,
				&savedJob.Company,
				&savedJob.Location,
				&savedJob.WorkType,
				&savedJob.ExperienceLevel,
				&savedJob.Salary,
				&savedJob.Description,
				&savedJob.PostedAt,
				&savedJob.SavedAt,
			)

			if err != nil {
				return c.Status(500).JSON(fiber.Map{
					"error": err.Error(),
				})
			}

			savedJobs = append(savedJobs, savedJob)
		}

		if err := rows.Err(); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		hasMore := len(savedJobs) > limit

		if hasMore {
			savedJobs = savedJobs[:limit]
		}

		var nextCursor *string

		if hasMore && len(savedJobs) > 0 {
			cursor := savedJobs[len(savedJobs)-1].SavedAt
			nextCursor = &cursor
		}

		return c.JSON(fiber.Map{
			"saved_jobs": savedJobs,
			"nextCursor": nextCursor,
			"nextPage":   hasMore,
		})
	}

	savedJobs := make([]SavedJob, 0)

	rows, err := db.DB.Query(`
		SELECT job_id
		FROM user_saved_jobs
		WHERE user_email = $1
	`, email)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	defer rows.Close()

	for rows.Next() {
		var savedJob SavedJob

		err := rows.Scan(&savedJob.JobId)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		savedJobs = append(savedJobs, savedJob)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"saved_jobs": savedJobs,
	})
}
