package main

import (
	"backend/db"
	"backend/redis"
	"backend/routes"
	"backend/storage"
	"backend/websocket"
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	awsS3 "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	db.Connect()
	redis.Connect()

	go websocket.SubscribeNotifications()

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal(err)
	}

	// go worker.Start(db.DB)

	s3Client := awsS3.NewFromConfig(cfg)
	bucket := os.Getenv("S3_BUCKET")

	storageClient := storage.NewS3Client(s3Client, bucket)
	_ = storageClient

	app := fiber.New()
	routes.SetupRoutes(app, storageClient)
	log.Fatal(app.Listen(":8080"))
}
