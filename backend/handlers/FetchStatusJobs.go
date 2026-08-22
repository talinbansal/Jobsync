package handlers

import (
	"backend/db"
	"backend/sessions"
	"database/sql"

	"github.com/gofiber/fiber/v2"
)

type JobTitle struct {
	JobName string `json:"jobName"`
	JobId   string `json:"jobId"`
	Status  string `json:"status"`
}

func FetchUnread(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var unreadCount int

	err := db.DB.QueryRow(
		`SELECT COUNT(*) 
		FROM job_applications 
		WHERE user_email=$1 
		AND read = false`,
		email,
	).Scan(&unreadCount)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"unread": unreadCount,
	})
}

func FetchStatusJobs(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var jobTitles []JobTitle
	var rows *sql.Rows

	rows, err := db.DB.Query(`
		SELECT j.title, j.job_id, ja.status FROM jobs j 
		JOIN job_applications ja 
		ON j.job_id = ja.job_id 
		WHERE ja.user_email = $1
	`,
		email)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	defer rows.Close()

	for rows.Next() {
		var row JobTitle

		err := rows.Scan(
			&row.JobName,
			&row.JobId,
			&row.Status,
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		jobTitles = append(jobTitles, row)
	}

	return c.JSON(fiber.Map{
		"job_statuses": jobTitles,
	})

}

func UpdateJobStatus(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	_, err := db.DB.Exec(
		`
		UPDATE job_applications
		SET read = TRUE
		WHERE user_email = $1
		AND read = FALSE;
		`,
		email,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return nil
}
