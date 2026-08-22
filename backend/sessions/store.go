package sessions

import (
	"time"

	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/storage/memory"
)

var Store = session.New(session.Config{
	Expiration:     24 * time.Hour,
	CookieHTTPOnly: true,

	// IMPORTANT FOR YOUR SETUP
	CookieSameSite: "Lax",

	// IMPORTANT: localhost HTTP dev setup
	CookieSecure: false,

	Storage: memory.New(),
})
