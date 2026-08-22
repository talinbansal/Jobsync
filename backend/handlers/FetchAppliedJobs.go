package handlers

import (
	"backend/db"
	"backend/sessions"
	"database/sql"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type AppliedJobFull struct {
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
	AppliedAt       string `json:"applied_at"`
}

func FetchAppliedJobs(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	limitStr := c.Query("limit")
	cursor := c.Query("cursor")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 6
	}

	appliedJobs := make([]AppliedJobFull, 0)
	var (
		rows *sql.Rows
	)

	if cursor != "" {
		rows, err = db.DB.Query(`
				SELECT j.*, a.applied_at FROM jobs j 
				JOIN job_applications a
				ON j.job_id = a.job_id 
				WHERE a.user_email = $1
				AND a.applied_at < $2 ORDER BY a.applied_at DESC limit $3 +1
			`,
			email,
			cursor,
			limit)
	} else {
		rows, err = db.DB.Query(`
				SELECT j.*, a.applied_at FROM jobs j 
				JOIN job_applications a 
				ON j.job_id = a.job_id 
				WHERE a.user_email = $1
				ORDER BY a.applied_at DESC
				limit $2 +1
			`,
			email,
			limit)
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	defer rows.Close()

	for rows.Next() {
		var appliedJob AppliedJobFull

		err := rows.Scan(
			&appliedJob.ID,
			&appliedJob.JobID,
			&appliedJob.Title,
			&appliedJob.Company,
			&appliedJob.Location,
			&appliedJob.WorkType,
			&appliedJob.ExperienceLevel,
			&appliedJob.Salary,
			&appliedJob.Description,
			&appliedJob.PostedAt,
			&appliedJob.AppliedAt,
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		appliedJobs = append(appliedJobs, appliedJob)
	}

	hasMore := false

	if len(appliedJobs) > limit {
		hasMore = true
		appliedJobs = appliedJobs[:limit] // trim extra row
	}

	nextCursor := ""

	if len(appliedJobs) > 0 {
		nextCursor = appliedJobs[len(appliedJobs)-1].AppliedAt
	}

	return c.JSON(fiber.Map{
		"applied_jobs": appliedJobs,
		"nextCursor":   nextCursor,
		"nextPage":     hasMore,
	})
}
