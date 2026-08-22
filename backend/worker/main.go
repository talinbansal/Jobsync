package main

import (
	"backend/db"
	"backend/redis"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("No .env file found")
	}

	db.Connect()
	redis.Connect()

	_, err = config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal("failed to load AWS config:", err)
	}

	go Start(db.DB)
	err = checkOutboxMessages(db.DB)
	if err != nil {
		log.Fatal("Outbox worker failed:", err)
	}
}
