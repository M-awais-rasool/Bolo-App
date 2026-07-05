package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"bolo-server/internal/platform/httpx"
)

const parentIDKey = "auth.parent_id"

// Middleware authenticates the parent from the Bearer access token and puts
// their id on the request context. Child-ownership checks build on top of
// this in the identity module.
func Middleware(tm *TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
		if !ok || raw == "" {
			httpx.Error(c, http.StatusUnauthorized, "unauthorized", "missing or malformed Authorization header")
			c.Abort()
			return
		}
		parentID, err := tm.ParseAccessToken(raw)
		if err != nil {
			httpx.Error(c, http.StatusUnauthorized, "invalid_token", "access token is invalid or expired")
			c.Abort()
			return
		}
		c.Set(parentIDKey, parentID)
		c.Next()
	}
}

// ParentID returns the authenticated parent's id; uuid.Nil if unauthenticated.
func ParentID(c *gin.Context) uuid.UUID {
	v, _ := c.Get(parentIDKey)
	id, _ := v.(uuid.UUID)
	return id
}
