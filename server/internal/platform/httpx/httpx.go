// Package httpx defines the API-wide error contract and shared HTTP middleware.
//
// Every error response has one shape:
//
//	{ "error": { "code": "<stable_snake_case>", "message": "<human readable>" } }
//
// Clients switch on code, never on message text.
package httpx

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func Error(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}

func ValidationError(c *gin.Context, err error) {
	Error(c, http.StatusBadRequest, "validation_failed", err.Error())
}

// Internal hides the underlying error from the client; the handler logs it.
func Internal(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "internal_error", "something went wrong")
}

func RequestLogger(log zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info().
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Int("status", c.Writer.Status()).
			Dur("duration", time.Since(start)).
			Msg("request")
	}
}
