// Package learning owns sessions, speech attempts, and the mastery graph —
// the `learning` bounded context (BACKEND_PLAN.md §1).
package learning

import (
	"time"

	"github.com/google/uuid"
)

type LessonSession struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	ChildID        uuid.UUID `gorm:"type:uuid"`
	CategoryCode   string
	LessonClientID string
	ClientKey      string
	Status         string
	StartedAt      time.Time
	CompletedAt    *time.Time
}

func (LessonSession) TableName() string { return "lesson_sessions" }

const (
	SessionActive    = "active"
	SessionCompleted = "completed"
)

type SpeechAttempt struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	SessionID      uuid.UUID `gorm:"type:uuid"`
	WordID         string
	AudioObjectKey *string
	Score          float64
	FeedbackCode   string
	ClientKey      string
	RecordedAt     *time.Time
	CreatedAt      time.Time
	RetainUntil    time.Time
}

func (SpeechAttempt) TableName() string { return "speech_attempts" }

type MasteryWord struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey"`
	ChildID         uuid.UUID `gorm:"type:uuid"`
	WordID          string
	AttemptCount    int
	AvgScore        float64
	FirstMasteredAt *time.Time
	UpdatedAt       time.Time
}

func (MasteryWord) TableName() string { return "mastery_words" }

type WeakPhoneme struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	ChildID    uuid.UUID `gorm:"type:uuid"`
	Phoneme    string
	MissCount  int
	LastSeenAt time.Time
}

func (WeakPhoneme) TableName() string { return "weak_phonemes" }
