package identity

import (
	"github.com/gin-gonic/gin"

	"bolo-server/internal/platform/auth"
)

func RegisterRoutes(api *gin.RouterGroup, h *Handler, tm *auth.TokenManager) {
	a := api.Group("/auth")
	a.POST("/register", h.Register)
	a.POST("/login", h.Login)
	a.POST("/refresh", h.Refresh)

	children := api.Group("/children", auth.Middleware(tm))
	children.POST("", h.AddChild)
	children.GET("", h.ListChildren)

	child := children.Group("/:child_id", h.childOwnership())
	child.PATCH("/category", h.ConfirmCategory)
}
