package companion

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
	authed := api.Group("/children/:child_id/companion", auth.Middleware(tm))
	authed.POST("", h.Select)
	authed.GET("", h.Get)
}

type selectRequest struct {
	Species string `json:"species" binding:"required"`
}

func (h *Handler) Select(c *gin.Context) {
	var req selectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}
	childID, err := uuid.Parse(c.Param("child_id"))
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
		return
	}
	comp, err := h.svc.Select(c.Request.Context(), auth.ParentID(c), childID, req.Species)
	if err != nil {
		switch {
		case errors.Is(err, ErrChildNotFound):
			httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
		case errors.Is(err, ErrUnknownSpecies):
			httpx.Error(c, http.StatusBadRequest, "unknown_species", "species must be one of: mano, pip, zizi")
		case errors.Is(err, ErrSpeciesConflict):
			httpx.Error(c, http.StatusConflict, "companion_exists", "this child already chose a different companion")
		default:
			h.log.Error().Err(err).Msg("select companion")
			httpx.Internal(c)
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"companion_id": comp.ID, "growth_stage": comp.GrowthStage})
}

func (h *Handler) Get(c *gin.Context) {
	childID, err := uuid.Parse(c.Param("child_id"))
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
		return
	}
	comp, err := h.svc.Get(c.Request.Context(), auth.ParentID(c), childID)
	if err != nil {
		switch {
		case errors.Is(err, ErrChildNotFound), errors.Is(err, ErrCompanionNotFound):
			httpx.Error(c, http.StatusNotFound, "not_found", "companion not found")
		default:
			h.log.Error().Err(err).Msg("get companion")
			httpx.Internal(c)
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"companion_id":         comp.ID,
		"species":              comp.Species,
		"growth_stage":         comp.GrowthStage,
		"words_mastered_count": comp.WordsMasteredCount,
	})
}
