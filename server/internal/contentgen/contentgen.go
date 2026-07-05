// Package contentgen is the AI lesson-generation agent — the `contentgen`
// bounded context (BACKEND_PLAN.md §7). It authors structured lesson content
// offline and asynchronously; no open-ended model output ever reaches a child
// directly. Everything generated passes the validation layer, and anything
// borderline waits for human review.
package contentgen

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"

	"bolo-server/internal/content"
)

// GenerationJob is the auditable domain record for one pipeline run.
type GenerationJob struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	TriggerReason  string
	ChildID        *uuid.UUID `gorm:"type:uuid"`
	CategoryCode   string
	Status         string
	InputContext   datatypes.JSON
	OutputLessonID *uuid.UUID `gorm:"type:uuid"`
	Error          *string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (GenerationJob) TableName() string { return "generation_jobs" }

// GenContext is the constrained input to generation. KnownWordIDs is the
// single most important field: it is the ONLY vocabulary the new lesson may
// assume as background, which is what makes generated content learnable by
// the specific child it targets (BACKEND_PLAN.md §7.3).
type GenContext struct {
	CategoryCode     string   `json:"category_code"`
	Reason           string   `json:"reason"`
	KnownWordIDs     []string `json:"known_word_ids"`
	ExistingWordIDs  []string `json:"existing_word_ids"`   // never reuse a word id
	ExistingLessons  []string `json:"existing_lesson_ids"` // never reuse a lesson id
	WeakPhonemes     []string `json:"weak_phonemes"`
	CompanionSpecies string   `json:"companion_species"`
	NextOrderIndex   int      `json:"next_order_index"`
}

// Generator produces one candidate lesson in the client's exact
// LessonContent shape. Implementations: StubGenerator (dev/test) and
// ClaudeGenerator (production).
type Generator interface {
	Generate(ctx context.Context, gc GenContext) (*content.LessonContent, error)
}
