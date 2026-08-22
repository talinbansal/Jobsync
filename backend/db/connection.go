package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_NAME"),
	)

	var err error

	DB, err = sql.Open("postgres", connStr)

	// Setup error check
	if err != nil {
		log.Fatal("Failed to Open DB:", err)
	}

	err = DB.Ping() // Connection error check
	if err != nil {
		log.Fatal("Failed to Connect to DB:", err)
	}

	log.Println("Connected to PostgreSql successfully")
}
