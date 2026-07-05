package companion

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ChildAccess proves parent→child ownership; the adapter lives in the
// composition root.
type ChildAccess interface {
	OwnsChild(ctx context.Context, parentID, childID uuid.UUID) (bool, error)
}

type Service struct {
	db       *gorm.DB
	children ChildAccess
}

func NewService(db *gorm.DB, children ChildAccess) *Service {
	return &Service{db: db, children: children}
}

// Select is the journey's step 5 (BACKEND_PLAN.md §6). Idempotent: retrying
// with the same species returns the existing companion; a different species
// conflicts — switching companions is a product decision, not a retry.
func (s *Service) Select(ctx context.Context, parentID, childID uuid.UUID, species string) (*Companion, error) {
	owned, err := s.children.OwnsChild(ctx, parentID, childID)
	if err != nil {
		return nil, err
	}
	if !owned {
		return nil, ErrChildNotFound
	}
	if !validSpecies[species] {
		return nil, ErrUnknownSpecies
	}

	existing, err := s.byChild(ctx, childID)
	if err == nil {
		if existing.Species == species {
			return existing, nil
		}
		return nil, ErrSpeciesConflict
	}
	if !errors.Is(err, ErrCompanionNotFound) {
		return nil, err
	}

	c := &Companion{
		ID: uuid.New(), ChildID: childID, Species: species, GrowthStage: StageEgg,
	}
	if err := s.db.WithContext(ctx).Create(c).Error; err != nil {
		return nil, err
	}
	return c, nil
}

func (s *Service) Get(ctx context.Context, parentID, childID uuid.UUID) (*Companion, error) {
	owned, err := s.children.OwnsChild(ctx, parentID, childID)
	if err != nil {
		return nil, err
	}
	if !owned {
		return nil, ErrChildNotFound
	}
	return s.byChild(ctx, childID)
}

// RecordMastery folds a new total-words-mastered count into the companion
// and reports whether a growth stage was crossed. Called by the learning
// module through its port on session completion; no parent scoping because
// it is never reachable from a request path directly.
func (s *Service) RecordMastery(ctx context.Context, childID uuid.UUID, totalMastered int) (bool, error) {
	c, err := s.byChild(ctx, childID)
	if err != nil {
		if errors.Is(err, ErrCompanionNotFound) {
			return false, nil // no companion chosen yet — growth simply waits
		}
		return false, err
	}
	newStage := StageFor(totalMastered)
	grew := stageIndex(newStage) > stageIndex(c.GrowthStage)
	err = s.db.WithContext(ctx).Model(c).Updates(map[string]any{
		"words_mastered_count": totalMastered,
		"growth_stage":         newStage,
		"updated_at":           time.Now(),
	}).Error
	if err != nil {
		return false, err
	}
	return grew, nil
}

// SpeciesForChild feeds the generation pipeline so a generated lesson's
// intro/prompt lines match the child's companion voice; "" when none chosen.
func (s *Service) SpeciesForChild(ctx context.Context, childID uuid.UUID) (string, error) {
	c, err := s.byChild(ctx, childID)
	if errors.Is(err, ErrCompanionNotFound) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return c.Species, nil
}

// StageForChild is the read the reporting snapshot needs; "egg" when no
// companion has been chosen yet.
func (s *Service) StageForChild(ctx context.Context, childID uuid.UUID) (string, error) {
	c, err := s.byChild(ctx, childID)
	if errors.Is(err, ErrCompanionNotFound) {
		return StageEgg, nil
	}
	if err != nil {
		return "", err
	}
	return c.GrowthStage, nil
}

func (s *Service) byChild(ctx context.Context, childID uuid.UUID) (*Companion, error) {
	var c Companion
	err := s.db.WithContext(ctx).First(&c, "child_id = ?", childID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrCompanionNotFound
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}
