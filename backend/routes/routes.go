package routes

import (
	"backend/auth"
	"backend/handlers"
	"backend/middleware"
	"backend/sessions"
	"backend/storage"
	"backend/websocket"

	fiberws "github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, s3Client *storage.S3Client) {

	app.Use(middleware.CORS())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is running",
		})
	})

	app.Use("/ws", func(c *fiber.Ctx) error {

		sess, _ := sessions.Store.Get(c)
		emailVal := sess.Get("email")
		email, ok := emailVal.(string)

		if !ok || email == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "unauthorized",
			})
		}

		c.Locals("email", email)

		return c.Next()
	})

	handler := handlers.NewAccountHandler(s3Client)

	app.Post("/verify_login", handlers.Login)
	app.Post("/create_account", handlers.CreateAccount)
	app.Post("/upload_setup_data", handler.AccountSetup)
	app.Post("/auto_submit_application", handlers.AutoSubmitApp)
	app.Post("/submit_application", handler.SubmitApp)
	app.Post("/add_saved_jobs", handlers.AddSavedjobs)
	app.Post("/add_folders", handlers.AddFolders)
	app.Post("/add_job_to_folder", handlers.AddJobToFolder)
	app.Post("/fetch_folder_jobs", handlers.FetchFolderJobs) // Its GET but since it has a body i turned it into POST
	app.Get("/fetch_profile_data", handlers.GetProfileData)
	app.Get("/fetch_points", handlers.FetchPoints)
	app.Get("/fetch_jobs", handlers.GetJobs)
	app.Get("/view_job", handlers.ViewJob)
	app.Get("/fetch_saved_jobs", handlers.FetchSavedJobs)
	app.Get("/fetch_applied_jobs", handlers.FetchAppliedJobs)
	app.Get("/get_folders", handlers.GetFolders)
	app.Get("/check_session", auth.CheckSession)
	app.Get("/ws", fiberws.New(websocket.WebSocket))
	app.Get("/fetch_applied_jobs_status", handlers.FetchStatusJobs)
	app.Get("/fetch_unread", handlers.FetchUnread)
	app.Patch("/update_folder", handlers.UpdateFolder)
	app.Patch("/update_job_status", handlers.UpdateJobStatus)
	app.Delete("/delete_saved_jobs", handlers.DeleteSavedjobs)
	app.Delete("/delete_folder", handlers.DeleteFolder)
}
