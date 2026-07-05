package content

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type PackRecord struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
	CategoryCode  string
	Revision      int
	SchemaVersion int
	Status        string
	ObjectKey     string
	PublishedAt   *time.Time
	CreatedAt     time.Time
}

func (PackRecord) TableName() string { return "content_packs" }

// LessonRecord is the system of record for one lesson. Content holds the
// exact client LessonContent JSON; pedagogy metadata columns
// (target_phonemes, known_words_scope) exist in the schema for the
// generation pipeline and stay out of this model until M4 uses them.
type LessonRecord struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	CategoryCode string
	ClientID     string
	OrderIndex   int
	Content      datatypes.JSON
	Source       string
	Status       string
	ChildID      *uuid.UUID `gorm:"type:uuid"`
	Version      int
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (LessonRecord) TableName() string { return "lessons" }
