package learning

import (
	"github.com/gin-gonic/gin"

	"bolo-server/internal/platform/auth"
)

func RegisterRoutes(api *gin.RouterGroup, h *Handler, tm *auth.TokenManager) {
	authed := api.Group("", auth.Middleware(tm))

	// Ownership is proven inside StartSession (child) and by the
	// sessionOwnership middleware (session) — same 404-not-403 rule as
	// the identity module.
	authed.POST("/children/:child_id/lessons/:lesson_id/sessions", h.StartSession)

	session := authed.Group("/sessions/:session_id", h.sessionOwnership())
	session.POST("/attempts", h.RecordAttempt)
	session.POST("/complete", h.CompleteSession)

	authed.POST("/sync/attempts", h.SyncAttempts)
}
