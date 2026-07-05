// Package reporting owns what parents see: the progress snapshot behind the
// Home screen and the weekly digest — the `reporting` bounded context
// (BACKEND_PLAN.md §1). It reads other modules only through ports.
package reporting

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

type Snapshot struct {
	ChildID       uuid.UUID `gorm:"type:uuid;primaryKey"`
	WordsMastered int
	StreakDays    int
	GrowthStage   string
	UpdatedAt     time.Time
}

func (Snapshot) TableName() string { return "progress_snapshots" }

var ErrChildNotFound = errors.New("child not found")

// Ports — adapters live in the composition root.
type (
	ChildAccess interface {
		// Child returns the child's name and whether the parent owns them.
		Child(ctx context.Context, parentID, childID uuid.UUID) (name string, owned bool, err error)
	}

	LearningReads interface {
		TotalMastered(ctx context.Context, childID uuid.UUID) (int64, error)
		MasteredSince(ctx context.Context, childID uuid.UUID, since time.Time) (int64, error)
		WeakPhonemeCodes(ctx context.Context, childID uuid.UUID, limit int) ([]string, error)
		RecentAudioKeys(ctx context.Context, childID uuid.UUID, limit int) ([]string, error)
		StreakDays(ctx context.Context, childID uuid.UUID) (int, error)
	}

	CompanionReads interface {
		StageForChild(ctx context.Context, childID uuid.UUID) (string, error)
	}

	// ClipSigner turns a private audio key into a short-lived URL — object
	// keys never appear in API responses (BACKEND_PLAN.md §12).
	ClipSigner interface {
		PresignedGet(ctx context.Context, key string, ttl time.Duration) (string, error)
	}
)
