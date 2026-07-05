package contentgen

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"gorm.io/gorm"

	"bolo-server/internal/content"
	"bolo-server/internal/platform/jobs"
)

// Ports into other modules; adapters live in the composition roots.
type (
	LearningReads interface {
		MasteredWordIDs(ctx context.Context, childID uuid.UUID) ([]string, error)
		WeakPhonemeCodes(ctx context.Context, childID uuid.UUID, limit int) ([]string, error)
	}
	CompanionReads interface {
		SpeciesForChild(ctx context.Context, childID uuid.UUID) (string, error)
	}
)

type Service struct {
	db        *gorm.DB
	authoring *content.Authoring
	learning  LearningReads
	companion CompanionReads
	generator Generator
	log       zerolog.Logger
}

func NewService(db *gorm.DB, authoring *content.Authoring, learning LearningReads, companion CompanionReads, generator Generator, log zerolog.Logger) *Service {
	return &Service{db: db, authoring: authoring, learning: learning, companion: companion, generator: generator, log: log}
}

// Run executes the full pipeline from BACKEND_PLAN.md §7.2 for one trigger:
// gather constrained context → generate → validate → store with the verdict's
// status → record the auditable generation_jobs row.
func (s *Service) Run(ctx context.Context, args jobs.LessonGenerationRequestedArgs) error {
	// Idempotency: duplicate triggers (retried completions are at-least-once)
	// must not stack up lessons the child hasn't even seen yet.
	pending, err := s.authoring.PendingAILessonExists(ctx, args.ChildID, args.CategoryCode)
	if err != nil {
		return err
	}
	if pending {
		s.log.Info().Str("child_id", args.ChildID.String()).Msg("generation skipped: unplayed AI lesson already exists")
		return nil
	}

	gc, err := s.buildContext(ctx, args)
	if err != nil {
		return err
	}
	job, err := s.createJob(ctx, args, gc)
	if err != nil {
		return err
	}

	lesson, err := s.generator.Generate(ctx, *gc)
	if err != nil {
		s.finishJob(ctx, job, "failed", nil, err.Error())
		return err // River retries — generation failures are usually transient
	}

	verdict, reasons := Validate(lesson, *gc)
	switch verdict {
	case VerdictReject:
		// Deterministic content failure: audit it and stop — retrying the
		// same context would loop, and nothing unsafe was stored.
		s.finishJob(ctx, job, "failed", nil, "rejected: "+strings.Join(reasons, "; "))
		s.log.Warn().Strs("reasons", reasons).Str("lesson", lesson.ID).Msg("generated lesson rejected")
		return nil
	case VerdictNeedsReview:
		lessonID, err := s.authoring.StoreGenerated(ctx, args.CategoryCode, args.ChildID, *lesson, gc.NextOrderIndex, "pending_review")
		if err != nil {
			return err
		}
		s.finishJob(ctx, job, "needs_review", &lessonID, strings.Join(reasons, "; "))
		s.log.Info().Str("lesson", lesson.ID).Strs("reasons", reasons).Msg("generated lesson queued for review")
	default:
		lessonID, err := s.authoring.StoreGenerated(ctx, args.CategoryCode, args.ChildID, *lesson, gc.NextOrderIndex, "active")
		if err != nil {
			return err
		}
		s.finishJob(ctx, job, "completed", &lessonID, "")
		s.log.Info().Str("lesson", lesson.ID).Str("child_id", args.ChildID.String()).Msg("generated lesson published")
	}
	return nil
}

func (s *Service) buildContext(ctx context.Context, args jobs.LessonGenerationRequestedArgs) (*GenContext, error) {
	known, err := s.learning.MasteredWordIDs(ctx, args.ChildID)
	if err != nil {
		return nil, err
	}
	weak, err := s.learning.WeakPhonemeCodes(ctx, args.ChildID, 3)
	if err != nil {
		return nil, err
	}
	species, err := s.companion.SpeciesForChild(ctx, args.ChildID)
	if err != nil {
		return nil, err
	}
	existingWords, existingLessons, err := s.authoring.ExistingWordIDs(ctx, args.CategoryCode)
	if err != nil {
		return nil, err
	}
	lastIndex, err := s.authoring.LastOrderIndex(ctx, args.CategoryCode)
	if err != nil {
		return nil, err
	}
	return &GenContext{
		CategoryCode:     args.CategoryCode,
		Reason:           args.Reason,
		KnownWordIDs:     known,
		ExistingWordIDs:  existingWords,
		ExistingLessons:  existingLessons,
		WeakPhonemes:     weak,
		CompanionSpecies: species,
		NextOrderIndex:   lastIndex + 1,
	}, nil
}

func (s *Service) createJob(ctx context.Context, args jobs.LessonGenerationRequestedArgs, gc *GenContext) (*GenerationJob, error) {
	inputContext, err := json.Marshal(gc)
	if err != nil {
		return nil, err
	}
	job := &GenerationJob{
		ID: uuid.New(), TriggerReason: args.Reason, ChildID: &args.ChildID,
		CategoryCode: args.CategoryCode, Status: "running", InputContext: inputContext,
	}
	if err := s.db.WithContext(ctx).Create(job).Error; err != nil {
		return nil, err
	}
	return job, nil
}

func (s *Service) finishJob(ctx context.Context, job *GenerationJob, status string, lessonID *uuid.UUID, errText string) {
	updates := map[string]any{"status": status, "updated_at": time.Now()}
	if lessonID != nil {
		updates["output_lesson_id"] = *lessonID
	}
	if errText != "" {
		updates["error"] = errText
	}
	if err := s.db.WithContext(ctx).Model(job).Updates(updates).Error; err != nil {
		s.log.Error().Err(err).Msg(fmt.Sprintf("update generation job %s", job.ID))
	}
}
