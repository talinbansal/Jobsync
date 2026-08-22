package handlers

import (
	"backend/db"
	"backend/sessions"
	"database/sql"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/lib/pq"
)

func AddJobToFolder(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folderId := c.Query("folder_id")
	jobId := c.Query("job_id")

	_, err := db.DB.Exec(`
		UPDATE job_folders SET
		job_id= COALESCE(job_id, ARRAY[]::TEXT[]) || ARRAY[$1]
		WHERE folder_id = $2
	`,
		jobId,
		folderId,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "completed",
	})
}

func FetchFolderJobs(c *fiber.Ctx) error {
	limitStr := c.Query("limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 6
	}

	cursor := c.Query("cursor")

	type Request struct {
		JobIDs []string `json:"job_ids"`
	}
	var body Request
	var (
		rows *sql.Rows
	)

	err = c.BodyParser(&body)

	if cursor != "" {
		rows, err = db.DB.Query(`
		SELECT id, job_id, title, company, location, work_type, 
		experience_level, salary, description, posted_at
		FROM jobs WHERE posted_at < $1 
		AND job_id = ANY($2) 
		ORDER BY posted_at DESC
		LIMIT $3
	 `,
			cursor,
			pq.Array(body.JobIDs),
			limit+1,
		)
	} else {
		rows, err = db.DB.Query(`
		SELECT id, job_id, title, company, location, work_type, 
		experience_level, salary, description, posted_at
		FROM jobs 
		WHERE job_id = ANY($1) 
		ORDER BY posted_at DESC
		LIMIT $2
	 `,
			pq.Array(body.JobIDs),
			limit+1,
		)
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	defer rows.Close()

	var jobs []Job

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

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
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
