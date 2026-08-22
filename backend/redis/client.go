package redis

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

var Ctx = context.Background()

func Connect() {
	Client = redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_ADDR"),
	})

	_, err := Client.Ping(Ctx).Result()

	if err != nil {
		panic(err)
	}

	println("Connected to Redis")
}
