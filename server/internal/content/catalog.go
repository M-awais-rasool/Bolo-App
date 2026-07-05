package content

import (
	"context"
	"encoding/json"
	"errors"

	"gorm.io/gorm"
)

// Catalog is the content module's public read interface: other modules
// (learning today, contentgen in M4) resolve lessons through it, never
// through the lessons table directly (BACKEND_PLAN.md §1).
type Catalog struct {
	db *gorm.DB
}

func NewCatalog(db *gorm.DB) *Catalog { return &Catalog{db: db} }

// LessonInfo is the cross-module DTO: just what a consumer needs to run and
// score a lesson, not the full renderable content.
type LessonInfo struct {
	ClientID     string
	OrderIndex   int
	WordIDs      []string
	SoundLetters string // the lesson's drill phoneme, "" if it has none
}

// Lesson resolves an active shared-curriculum lesson by its client id.
func (c *Catalog) Lesson(ctx context.Context, categoryCode, clientID string) (*LessonInfo, error) {
	var rec LessonRecord
	err := c.db.WithContext(ctx).
		Where("category_code = ? AND client_id = ? AND child_id IS NULL AND status = 'active'",
			categoryCode, clientID).
		First(&rec).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrLessonNotFound
	}
	if err != nil {
		return nil, err
	}
	return toInfo(&rec)
}

// LessonAfter returns the next active lesson in journey order, or
// ErrLessonNotFound at the end of the curriculum — which is exactly the
// condition that will trigger generation in M4 (BACKEND_PLAN.md §7.1).
func (c *Catalog) LessonAfter(ctx context.Context, categoryCode string, orderIndex int) (*LessonInfo, error) {
	var rec LessonRecord
	err := c.db.WithContext(ctx).
		Where("category_code = ? AND order_index > ? AND child_id IS NULL AND status = 'active'",
			categoryCode, orderIndex).
		Order("order_index").
		First(&rec).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrLessonNotFound
	}
	if err != nil {
		return nil, err
	}
	return toInfo(&rec)
}

func toInfo(rec *LessonRecord) (*LessonInfo, error) {
	var lesson LessonContent
	if err := json.Unmarshal(rec.Content, &lesson); err != nil {
		return nil, err
	}
	info := &LessonInfo{ClientID: rec.ClientID, OrderIndex: rec.OrderIndex}
	for _, w := range lesson.Words {
		info.WordIDs = append(info.WordIDs, w.ID)
	}
	if lesson.Sound != nil {
		info.SoundLetters = lesson.Sound.Letters
	}
	return info, nil
}
