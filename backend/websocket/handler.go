package websocket

import (
	"fmt"

	fiberws "github.com/gofiber/contrib/websocket"
)

func WebSocket(conn *fiberws.Conn) {
	email := conn.Locals("email").(string)

	fmt.Println("WebSocket connected:", email)

	mu.Lock()

	if oldConn, exists := Clients[email]; exists {
		oldConn.Close()
	}

	Clients[email] = conn

	mu.Unlock()

	mu.Lock()
	Clients[email] = conn
	mu.Unlock()

	defer func() {
		mu.Lock()
		delete(Clients, email)
		mu.Unlock()

		conn.Close()
	}()

	for {
		_, _, err := conn.ReadMessage()

		if err != nil {
			break
		}
	}
}
