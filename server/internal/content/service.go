package content

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Publisher validates a pack, records it in Postgres, and uploads the
// immutable serving objects (BACKEND_PLAN.md §4.2):
//
//	packs/{category}/{revision}.json   the pack, cacheable forever
//	packs/{category}/latest.json       tiny pointer: {category_code, revision, url}
type Publisher struct {
	db    *gorm.DB
	store ObjectStore
}

type ObjectStore interface {
	EnsureBucketPublicRead(ctx context.Context) error
	PutJSON(ctx context.Context, key string, v any) error
}

func NewPublisher(db *gorm.DB, store ObjectStore) *Publisher {
	return &Publisher{db: db, store: store}
}

type LatestPointer struct {
	CategoryCode string `json:"category_code"`
	Revision     int    `json:"revision"`
	URL          string `json:"url"`
}

func (p *Publisher) Publish(ctx context.Context, categoryCode string, pack *ContentPack) (*LatestPointer, error) {
	if err := pack.Validate(); err != nil {
		return nil, fmt.Errorf("pack failed validation: %w", err)
	}

	// Revisions are monotonic per category; an already-published revision is
	// immutable and can never be overwritten.
	var last PackRecord
	err := p.db.WithContext(ctx).
		Where("category_code = ?", categoryCode).
		Order("revision DESC").
		First(&last).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if err == nil && pack.Revision <= last.Revision {
		return nil, fmt.Errorf("revision %d already published for %s (latest is %d) — bump the pack revision",
			pack.Revision, categoryCode, last.Revision)
	}

	objectKey := fmt.Sprintf("packs/%s/%d.json", categoryCode, pack.Revision)
	now := time.Now()

	// DB first: if the upload fails afterwards, re-running publish with the
	// next revision is always safe; a dangling DB row is visible and fixable,
	// a dangling public object with no record is not.
	txErr := p.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i, lesson := range pack.Lessons {
			if err := upsertLesson(tx, categoryCode, i, lesson); err != nil {
				return err
			}
		}
		return tx.Create(&PackRecord{
			ID:            uuid.New(),
			CategoryCode:  categoryCode,
			Revision:      pack.Revision,
			SchemaVersion: pack.SchemaVersion,
			Status:        "published",
			ObjectKey:     objectKey,
			PublishedAt:   &now,
		}).Error
	})
	if txErr != nil {
		return nil, txErr
	}

	if err := p.store.EnsureBucketPublicRead(ctx); err != nil {
		return nil, err
	}
	if err := p.store.PutJSON(ctx, objectKey, pack); err != nil {
		return nil, err
	}
	latest := &LatestPointer{CategoryCode: categoryCode, Revision: pack.Revision, URL: objectKey}
	if err := p.store.PutJSON(ctx, fmt.Sprintf("packs/%s/latest.json", categoryCode), latest); err != nil {
		return nil, err
	}
	return latest, nil
}

// upsertLesson keeps the lessons table in sync with the published pack:
// new client ids insert, existing ones update in place with a version bump.
func upsertLesson(tx *gorm.DB, categoryCode string, orderIndex int, lesson LessonContent) error {
	body, err := json.Marshal(lesson)
	if err != nil {
		return err
	}

	var existing LessonRecord
	err = tx.Where("category_code = ? AND client_id = ? AND child_id IS NULL", categoryCode, lesson.ID).
		First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return tx.Create(&LessonRecord{
			ID:           uuid.New(),
			CategoryCode: categoryCode,
			ClientID:     lesson.ID,
			OrderIndex:   orderIndex,
			Content:      body,
			Source:       "seed",
			Status:       "active",
			Version:      1,
		}).Error
	}
	if err != nil {
		return err
	}
	return tx.Model(&existing).Updates(map[string]any{
		"order_index": orderIndex,
		"content":     body,
		"version":     existing.Version + 1,
		"updated_at":  time.Now(),
	}).Error
}
