package content

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"bolo-server/internal/platform/auth"
	"bolo-server/internal/platform/httpx"
)

var ErrChildNotFound = errors.New("child not found")

// Overlay ports — adapters live in the composition root.
type (
	Children interface {
		// CategoryOf returns the child's category and whether the parent owns them.
		CategoryOf(ctx context.Context, parentID, childID uuid.UUID) (code string, owned bool, err error)
	}
	MasteryReads interface {
		MasteredCountFor(ctx context.Context, childID uuid.UUID, wordIDs []string) (int64, error)
	}
)

// OverlayService serves the per-child content layer (BACKEND_PLAN.md §4.3):
// the base pack stays on the CDN; this endpoint only returns unlock state and
// the child's approved AI-generated lessons. If it fails offline, the cached
// pack still works — the overlay is a sync-up, not a gate.
type OverlayService struct {
	catalog   *Catalog
	authoring *Authoring
	children  Children
	mastery   MasteryReads
}

func NewOverlayService(catalog *Catalog, authoring *Authoring, children Children, mastery MasteryReads) *OverlayService {
	return &OverlayService{catalog: catalog, authoring: authoring, children: children, mastery: mastery}
}

type Overlay struct {
	BasePack struct {
		CategoryCode string `json:"category_code"`
		Revision     int    `json:"revision"`
	} `json:"base_pack"`
	UnlockedLessonIDs []string        `json:"unlocked_lesson_ids"`
	ExtraLessons      []LessonContent `json:"extra_lessons"`
}

func (s *OverlayService) ForChild(ctx context.Context, parentID, childID uuid.UUID) (*Overlay, error) {
	categoryCode, owned, err := s.children.CategoryOf(ctx, parentID, childID)
	if err != nil {
		return nil, err
	}
	if !owned {
		return nil, ErrChildNotFound
	}

	overlay := &Overlay{}
	overlay.BasePack.CategoryCode = categoryCode
	if overlay.BasePack.Revision, err = s.authoring.LatestPackRevision(ctx, categoryCode); err != nil {
		return nil, err
	}

	// Unlock rule: the first lesson is always open; each next lesson unlocks
	// when the previous one is fully mastered — mastery-based, never a timer.
	lessons, err := s.catalog.LessonsInOrder(ctx, categoryCode)
	if err != nil {
		return nil, err
	}
	previousMastered := true
	for _, lesson := range lessons {
		if !previousMastered {
			break
		}
		overlay.UnlockedLessonIDs = append(overlay.UnlockedLessonIDs, lesson.ClientID)
		mastered, err := s.mastery.MasteredCountFor(ctx, childID, lesson.WordIDs)
		if err != nil {
			return nil, err
		}
		previousMastered = mastered == int64(len(lesson.WordIDs))
	}

	// AI lessons only exist once the base curriculum is exhausted, so they
	// arrive unlocked.
	extra, err := s.authoring.ActiveAILessonsForChild(ctx, childID, categoryCode)
	if err != nil {
		return nil, err
	}
	overlay.ExtraLessons = extra
	for _, lesson := range extra {
		overlay.UnlockedLessonIDs = append(overlay.UnlockedLessonIDs, lesson.ID)
	}
	return overlay, nil
}

// --- HTTP ---

type OverlayHandler struct {
	svc *OverlayService
	log zerolog.Logger
}

func NewOverlayHandler(svc *OverlayService, log zerolog.Logger) *OverlayHandler {
	return &OverlayHandler{svc: svc, log: log}
}

func RegisterRoutes(api *gin.RouterGroup, h *OverlayHandler, tm *auth.TokenManager) {
	authed := api.Group("/children/:child_id/content-overlay", auth.Middleware(tm))
	authed.GET("", h.Get)
}

func (h *OverlayHandler) Get(c *gin.Context) {
	childID, err := uuid.Parse(c.Param("child_id"))
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
		return
	}
	overlay, err := h.svc.ForChild(c.Request.Context(), auth.ParentID(c), childID)
	if err != nil {
		if errors.Is(err, ErrChildNotFound) {
			httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
			return
		}
		h.log.Error().Err(err).Msg("content overlay")
		httpx.Internal(c)
		return
	}
	c.JSON(http.StatusOK, overlay)
}
