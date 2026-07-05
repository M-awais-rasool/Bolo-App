package content

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Authoring is the content module's write API for generated lessons, plus the
// reads the generation pipeline and review tooling need. Like Catalog, it is
// the only sanctioned way other modules touch the lessons tables.
type Authoring struct {
	db *gorm.DB
}

func NewAuthoring(db *gorm.DB) *Authoring { return &Authoring{db: db} }

// LastOrderIndex returns the highest order_index in the category across
// shared and per-child lessons — a new lesson always appends to the journey.
func (a *Authoring) LastOrderIndex(ctx context.Context, categoryCode string) (int, error) {
	var max *int
	err := a.db.WithContext(ctx).Model(&LessonRecord{}).
		Where("category_code = ?", categoryCode).
		Select("MAX(order_index)").Scan(&max).Error
	if err != nil {
		return 0, err
	}
	if max == nil {
		return -1, nil
	}
	return *max, nil
}

// ExistingWordIDs returns every word id already used by any lesson in the
// category — word ids are never reused (Bolo/ARCHITECTURE.md), which is what
// keeps progress records unambiguous.
func (a *Authoring) ExistingWordIDs(ctx context.Context, categoryCode string) ([]string, []string, error) {
	var rows []LessonRecord
	err := a.db.WithContext(ctx).
		Where("category_code = ? AND status != 'retired'", categoryCode).
		Find(&rows).Error
	if err != nil {
		return nil, nil, err
	}
	var wordIDs, lessonIDs []string
	for _, rec := range rows {
		var lesson LessonContent
		if err := json.Unmarshal(rec.Content, &lesson); err != nil {
			return nil, nil, err
		}
		lessonIDs = append(lessonIDs, lesson.ID)
		for _, w := range lesson.Words {
			wordIDs = append(wordIDs, w.ID)
		}
	}
	return wordIDs, lessonIDs, nil
}

// PendingAILessonExists reports whether the child already has an unretired
// AI lesson in this category — the worker's idempotency check, so retried
// or duplicate triggers never stack up extra lessons.
func (a *Authoring) PendingAILessonExists(ctx context.Context, childID uuid.UUID, categoryCode string) (bool, error) {
	var n int64
	err := a.db.WithContext(ctx).Model(&LessonRecord{}).
		Where("child_id = ? AND category_code = ? AND source = 'ai_generated' AND status IN ('active', 'pending_review')",
			childID, categoryCode).
		Count(&n).Error
	return n > 0, err
}

// StoreGenerated persists one generated lesson. status is 'active' only when
// every validation check passed; anything borderline lands as
// 'pending_review' and needs an explicit human promotion (BACKEND_PLAN.md §12).
func (a *Authoring) StoreGenerated(ctx context.Context, categoryCode string, childID uuid.UUID, lesson LessonContent, orderIndex int, status string) (uuid.UUID, error) {
	body, err := json.Marshal(lesson)
	if err != nil {
		return uuid.Nil, err
	}
	rec := &LessonRecord{
		ID: uuid.New(), CategoryCode: categoryCode, ClientID: lesson.ID,
		OrderIndex: orderIndex, Content: body,
		Source: "ai_generated", Status: status,
		ChildID: &childID, Version: 1,
	}
	if err := a.db.WithContext(ctx).Create(rec).Error; err != nil {
		return uuid.Nil, err
	}
	return rec.ID, nil
}

// ActiveAILessonsForChild returns the approved per-child lessons served in
// the content overlay (BACKEND_PLAN.md §4.3). Only status = active — a child
// never sees unreviewed content.
func (a *Authoring) ActiveAILessonsForChild(ctx context.Context, childID uuid.UUID, categoryCode string) ([]LessonContent, error) {
	var rows []LessonRecord
	err := a.db.WithContext(ctx).
		Where("child_id = ? AND category_code = ? AND source = 'ai_generated' AND status = 'active'",
			childID, categoryCode).
		Order("order_index").
		Find(&rows).Error
	if err != nil {
		return nil, err
	}
	lessons := make([]LessonContent, 0, len(rows))
	for _, rec := range rows {
		var lesson LessonContent
		if err := json.Unmarshal(rec.Content, &lesson); err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}
	return lessons, nil
}

// LatestPackRevision returns the newest published pack revision for the
// category (0 when none exists yet).
func (a *Authoring) LatestPackRevision(ctx context.Context, categoryCode string) (int, error) {
	var rec PackRecord
	err := a.db.WithContext(ctx).
		Where("category_code = ? AND status = 'published'", categoryCode).
		Order("revision DESC").
		First(&rec).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return rec.Revision, nil
}

// --- review queue (cmd/lessons) ---

func (a *Authoring) PendingReview(ctx context.Context) ([]LessonRecord, error) {
	var rows []LessonRecord
	err := a.db.WithContext(ctx).
		Where("status = 'pending_review'").
		Order("created_at").
		Find(&rows).Error
	return rows, err
}

func (a *Authoring) LessonRecordByID(ctx context.Context, id uuid.UUID) (*LessonRecord, error) {
	var rec LessonRecord
	if err := a.db.WithContext(ctx).First(&rec, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLessonNotFound
		}
		return nil, err
	}
	return &rec, nil
}

// SetStatus performs the auditable review transition: pending_review →
// active (approve) or retired (reject).
func (a *Authoring) SetStatus(ctx context.Context, id uuid.UUID, status string) error {
	return a.db.WithContext(ctx).Model(&LessonRecord{}).
		Where("id = ?", id).
		Updates(map[string]any{"status": status, "updated_at": time.Now()}).Error
}
