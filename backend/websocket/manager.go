package websocket

import (
	"fmt"
	"sync"

	fiberws "github.com/gofiber/contrib/websocket"
)

var (
	Clients = make(map[string]*fiberws.Conn)
	mu      sync.RWMutex
)

func SendToUser(email string, message []byte) {
	mu.RLock()
	conn, exists := Clients[email]
	mu.RUnlock()

	fmt.Println("Trying send to:", email)
	fmt.Println("Connection exists:", exists)

	if !exists {
		return
	}

	fmt.Println("Payload:", string(message))

	err := conn.WriteMessage(
		fiberws.TextMessage,
		message,
	)

	if err != nil {
		fmt.Println("Write error:", err)
		mu.Lock()
		delete(Clients, email)
		mu.Unlock()

		conn.Close()
	}

}
