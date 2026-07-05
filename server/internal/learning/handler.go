package learning

import (
	"encoding/base64"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"bolo-server/internal/platform/auth"
	"bolo-server/internal/platform/httpx"
)

// Audio uploads are short child utterances; anything bigger is a client bug.
const maxAudioBytes = 5 << 20 // 5 MiB

type Handler struct {
	svc *Service
	log zerolog.Logger
}

func NewHandler(svc *Service, log zerolog.Logger) *Handler {
	return &Handler{svc: svc, log: log}
}

// --- start session (BACKEND_PLAN.md §6, step 8) ---

type startSessionRequest struct {
	ClientKey string `json:"client_key" binding:"required,min=6,max=100"`
}

func (h *Handler) StartSession(c *gin.Context) {
	var req startSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}
	childID, err := uuid.Parse(c.Param("child_id"))
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
		return
	}
	session, err := h.svc.StartSession(c.Request.Context(), auth.ParentID(c), childID, c.Param("lesson_id"), req.ClientKey)
	if err != nil {
		switch {
		case errors.Is(err, ErrChildNotFound):
			httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
		case errors.Is(err, ErrLessonNotFound):
			httpx.Error(c, http.StatusNotFound, "lesson_not_found", "lesson not found in this child's category")
		default:
			h.fail(c, err)
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"session_id": session.ID, "lesson_id": session.LessonClientID})
}

// --- live attempt (BACKEND_PLAN.md §6, step 9 — the REST-only v1 path) ---

func (h *Handler) RecordAttempt(c *gin.Context) {
	session := sessionFromContext(c)

	wordID, clientKey := c.PostForm("word_id"), c.PostForm("client_key")
	if wordID == "" || clientKey == "" {
		httpx.Error(c, http.StatusBadRequest, "validation_failed", "word_id and client_key form fields are required")
		return
	}
	file, err := c.FormFile("audio")
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "validation_failed", "audio file field is required")
		return
	}
	if file.Size > maxAudioBytes {
		httpx.Error(c, http.StatusRequestEntityTooLarge, "audio_too_large", "audio must be under 5MB")
		return
	}
	src, err := file.Open()
	if err != nil {
		h.fail(c, err)
		return
	}
	defer src.Close()
	audio, err := io.ReadAll(io.LimitReader(src, maxAudioBytes))
	if err != nil {
		h.fail(c, err)
		return
	}

	attempt, _, err := h.svc.RecordAttempt(c.Request.Context(), session, wordID, clientKey, audio, nil)
	if err != nil {
		switch {
		case errors.Is(err, ErrWordNotInLesson):
			httpx.Error(c, http.StatusBadRequest, "word_not_in_lesson", ErrWordNotInLesson.Error())
		case errors.Is(err, ErrAudioRequired):
			httpx.Error(c, http.StatusBadRequest, "audio_required", ErrAudioRequired.Error())
		default:
			h.fail(c, err)
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"word_id":       attempt.WordID,
		"score":         attempt.Score,
		"feedback_code": attempt.FeedbackCode,
	})
}

// --- complete (BACKEND_PLAN.md §6, step 10) ---

func (h *Handler) CompleteSession(c *gin.Context) {
	summary, err := h.svc.CompleteSession(c.Request.Context(), sessionFromContext(c))
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"lesson_mastered":            summary.LessonMastered,
		"words_mastered_delta":       summary.WordsMasteredDelta,
		"next_lesson_unlocked":       summary.NextLessonUnlocked,
		"companion_growth_triggered": summary.CompanionGrowthTriggered,
	})
}

// --- offline sync (BACKEND_PLAN.md §11) ---

type syncAttemptItem struct {
	ClientKey   string `json:"client_key" binding:"required,min=6,max=100"`
	SessionID   string `json:"session_id" binding:"required,uuid"`
	WordID      string `json:"word_id" binding:"required"`
	RecordedAt  string `json:"recorded_at" binding:"required"`
	AudioBase64 string `json:"audio_base64" binding:"required"`
}

type syncRequest struct {
	Attempts []syncAttemptItem `json:"attempts" binding:"required,min=1,max=100,dive"`
}

func (h *Handler) SyncAttempts(c *gin.Context) {
	var req syncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}

	items := make([]SyncItem, 0, len(req.Attempts))
	results := make([]SyncItemResult, 0, len(req.Attempts))
	for _, a := range req.Attempts {
		sessionID, _ := uuid.Parse(a.SessionID) // format enforced by binding
		recordedAt, err := time.Parse(time.RFC3339, a.RecordedAt)
		if err != nil {
			results = append(results, SyncItemResult{ClientKey: a.ClientKey, Status: "conflict", ErrorCode: "bad_recorded_at"})
			continue
		}
		audio, err := base64.StdEncoding.DecodeString(a.AudioBase64)
		if err != nil || len(audio) > maxAudioBytes {
			results = append(results, SyncItemResult{ClientKey: a.ClientKey, Status: "conflict", ErrorCode: "bad_audio"})
			continue
		}
		items = append(items, SyncItem{
			ClientKey: a.ClientKey, SessionID: sessionID, WordID: a.WordID,
			RecordedAt: recordedAt, Audio: audio,
		})
	}
	results = append(results, h.svc.SyncAttempts(c.Request.Context(), auth.ParentID(c), items)...)

	counts := map[string]int{}
	out := make([]gin.H, 0, len(results))
	for _, r := range results {
		counts[r.Status]++
		item := gin.H{"client_key": r.ClientKey, "status": r.Status}
		if r.Status == "conflict" {
			item["error_code"] = r.ErrorCode
		} else {
			item["score"] = r.Score
			item["feedback_code"] = r.FeedbackCode
		}
		out = append(out, item)
	}
	c.JSON(http.StatusOK, gin.H{
		"synced":     counts["synced"],
		"duplicates": counts["duplicate"],
		"conflicts":  counts["conflict"],
		"results":    out,
	})
}

// --- session ownership middleware ---

const sessionKey = "learning.session"

// sessionOwnership resolves :session_id through the parent→child→session
// chain; anything that doesn't hold returns 404 with no existence leak.
func (h *Handler) sessionOwnership() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := uuid.Parse(c.Param("session_id"))
		if err != nil {
			httpx.Error(c, http.StatusNotFound, "not_found", "session not found")
			c.Abort()
			return
		}
		session, err := h.svc.SessionForParent(c.Request.Context(), auth.ParentID(c), sessionID)
		if err != nil {
			if errors.Is(err, ErrSessionNotFound) {
				httpx.Error(c, http.StatusNotFound, "not_found", "session not found")
			} else {
				h.log.Error().Err(err).Msg("session ownership check failed")
				httpx.Internal(c)
			}
			c.Abort()
			return
		}
		c.Set(sessionKey, session)
		c.Next()
	}
}

func sessionFromContext(c *gin.Context) *LessonSession {
	v, _ := c.Get(sessionKey)
	session, _ := v.(*LessonSession)
	return session
}

func (h *Handler) fail(c *gin.Context, err error) {
	h.log.Error().Err(err).Str("path", c.Request.URL.Path).Msg("handler error")
	httpx.Internal(c)
}
