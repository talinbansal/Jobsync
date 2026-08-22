package handlers

import (
	"backend/db"
	"backend/sessions"
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

type FolderJobs struct {
	FolderName string   `json:"folder_name"`
	FolderId   string   `json:"folder_id"`
	JobIds     []string `json:"job_ids"`
}

func GetFolders(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var folderJobs []FolderJobs
	var folderJobsJSON []byte

	err := db.DB.QueryRow(`
		SELECT COALESCE(
			JSONB_AGG(
				JSONB_BUILD_OBJECT(
					'folder_name', f.name,
					'folder_id', f.id,
					'job_ids', COALESCE(job_data.job_ids, '[]'::jsonb)
				)
			),
			'[]'::jsonb
		)
		FROM folders f
		LEFT JOIN (
			SELECT
				jf.folder_id,
				JSONB_AGG(DISTINCT u.job_id) AS job_ids
			FROM job_folders jf
			LEFT JOIN UNNEST(jf.job_id) AS u(job_id)
				ON TRUE
			GROUP BY jf.folder_id
		) job_data
			ON job_data.folder_id = f.id
		WHERE f.user_email = $1;
	`,
		email,
	).Scan(&folderJobsJSON)

	if err != nil {
		fmt.Println("SQL ERROR:", err)

		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	err = json.Unmarshal(folderJobsJSON, &folderJobs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"folders": folderJobs,
	})
}
