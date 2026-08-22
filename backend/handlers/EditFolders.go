package handlers

import (
	"backend/db"
	"backend/sessions"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

type Folder struct {
	FolderName string   `json:"folder_name"`
	FolderId   string   `json:"folder_id"`
	FolderJobs []string `json:"job_ids"`
}

func AddFolders(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folderName := c.Query("folder_name")

	var folder Folder
	folder.FolderJobs = []string{}

	err := db.DB.QueryRow(`
	    WITH new_folder AS (
			INSERT INTO folders (name, user_email)
			VALUES ($1, $2)
			RETURNING id, name
		)
		INSERT INTO job_folders (folder_id)
		SELECT id
		FROM new_folder
		RETURNING
			(SELECT id FROM new_folder),
			(SELECT name FROM new_folder)
	`,
		folderName,
		email).Scan(
		&folder.FolderId,
		&folder.FolderName,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"folder": folder,
	})
}

func UpdateFolder(c *fiber.Ctx) error {
	fmt.Println("UpdateFolder called")
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folderId := c.Query("folder_id")
	folderNewName := c.Query("folder_name")

	_, err := db.DB.Exec(`
		UPDATE folders SET name = $1 WHERE user_email = $2 and id = $3 
	`,
		folderNewName,
		email,
		folderId)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Updated",
	})
}

func DeleteFolder(c *fiber.Ctx) error {
	sess, _ := sessions.Store.Get(c)
	emailVal := sess.Get("email")
	email, ok := emailVal.(string)
	if !ok || email == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folderId := c.Query("folder_id")

	_, err := db.DB.Exec(`
		DELETE FROM folders WHERE user_email = $1 AND id = $2
	`,
		email,
		folderId)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"Error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Deleted",
	})
}
