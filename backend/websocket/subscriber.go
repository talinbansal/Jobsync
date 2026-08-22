package websocket

import (
	"backend/redis"
	"encoding/json"
	"fmt"
)

type Message struct {
	Status  string `json:"status"`
	JobID   string `json:"jobId"`
	JobName string `json:"jobName"`
	Email   string `json:"email"`
}

type ClientNotification struct {
	Status  string `json:"status"`
	JobID   string `json:"jobId"`
	JobName string `json:"jobName"`
}

func SubscribeNotifications() {
	pubsub := redis.Client.Subscribe(
		redis.Ctx,
		"notifications",
	)

	fmt.Println("Subscribed to notifications")

	ch := pubsub.Channel()

	for msg := range ch {
		fmt.Println("Received:", msg.Payload)

		var notification Message

		err := json.Unmarshal(
			[]byte(msg.Payload),
			&notification,
		)

		if err != nil {
			fmt.Println("JSON error:", err)
			continue
		}

		clientMessage := ClientNotification{
			Status:  notification.Status,
			JobID:   notification.JobID,
			JobName: notification.JobName,
		}

		payload, _ := json.Marshal(clientMessage)

		SendToUser(
			notification.Email,
			[]byte(payload), // SendToUser expectes bytes
		)
	}
}
