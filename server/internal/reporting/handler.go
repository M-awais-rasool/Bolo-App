package reporting

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"bolo-server/internal/platform/auth"
	"bolo-server/internal/platform/httpx"
)

type Handler struct {
	svc *Service
	log zerolog.Logger
}

func NewHandler(svc *Service, log zerolog.Logger) *Handler {
	return &Handler{svc: svc, log: log}
}

func RegisterRoutes(api *gin.RouterGroup, h *Handler, tm *auth.TokenManager) {
	authed := api.Group("/children/:child_id/digest", auth.Middleware(tm))
	authed.GET("/weekly", h.WeeklyDigest)
}

func (h *Handler) WeeklyDigest(c *gin.Context) {
	childID, err := uuid.Parse(c.Param("child_id"))
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
		return
	}
	digest, err := h.svc.WeeklyDigest(c.Request.Context(), auth.ParentID(c), childID)
	if err != nil {
		if errors.Is(err, ErrChildNotFound) {
			httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
			return
		}
		h.log.Error().Err(err).Msg("weekly digest")
		httpx.Internal(c)
		return
	}
	c.JSON(http.StatusOK, digest)
}
