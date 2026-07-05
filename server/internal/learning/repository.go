package learning

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func notFoundMapped(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

// --- sessions ---

func (r *Repository) CreateSession(ctx context.Context, s *LessonSession) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *Repository) SessionByID(ctx context.Context, id uuid.UUID) (*LessonSession, error) {
	var s LessonSession
	if err := r.db.WithContext(ctx).First(&s, "id = ?", id).Error; err != nil {
		return nil, notFoundMapped(err)
	}
	return &s, nil
}

func (r *Repository) SessionByClientKey(ctx context.Context, childID uuid.UUID, clientKey string) (*LessonSession, error) {
	var s LessonSession
	err := r.db.WithContext(ctx).
		First(&s, "child_id = ? AND client_key = ?", childID, clientKey).Error
	if err != nil {
		return nil, notFoundMapped(err)
	}
	return &s, nil
}

func (r *Repository) MarkSessionCompleted(ctx context.Context, id uuid.UUID, at time.Time) error {
	return r.db.WithContext(ctx).
		Model(&LessonSession{}).
		Where("id = ? AND status = ?", id, SessionActive).
		Updates(map[string]any{"status": SessionCompleted, "completed_at": at}).Error
}

// --- attempts ---

func (r *Repository) CreateAttempt(ctx context.Context, a *SpeechAttempt) error {
	return r.db.WithContext(ctx).Create(a).Error
}

func (r *Repository) AttemptByClientKey(ctx context.Context, sessionID uuid.UUID, clientKey string) (*SpeechAttempt, error) {
	var a SpeechAttempt
	err := r.db.WithContext(ctx).
		First(&a, "session_id = ? AND client_key = ?", sessionID, clientKey).Error
	if err != nil {
		return nil, notFoundMapped(err)
	}
	return &a, nil
}

// --- mastery ---

// UpsertMastery folds one scored attempt into the child's mastery row for
// that word: running average, attempt count, and the one-way transition to
// mastered when the score first crosses the threshold.
func (r *Repository) UpsertMastery(ctx context.Context, childID uuid.UUID, wordID string, score, threshold float64, at time.Time) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var m MasteryWord
		err := tx.First(&m, "child_id = ? AND word_id = ?", childID, wordID).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			m = MasteryWord{
				ID: uuid.New(), ChildID: childID, WordID: wordID,
				AttemptCount: 1, AvgScore: score, UpdatedAt: at,
			}
			if score >= threshold {
				m.FirstMasteredAt = &at
			}
			return tx.Create(&m).Error
		}
		if err != nil {
			return err
		}
		updates := map[string]any{
			"attempt_count": m.AttemptCount + 1,
			"avg_score":     (m.AvgScore*float64(m.AttemptCount) + score) / float64(m.AttemptCount+1),
			"updated_at":    at,
		}
		if m.FirstMasteredAt == nil && score >= threshold {
			updates["first_mastered_at"] = at
		}
		return tx.Model(&m).Updates(updates).Error
	})
}

// MasteredCount returns how many of wordIDs this child has mastered.
func (r *Repository) MasteredCount(ctx context.Context, childID uuid.UUID, wordIDs []string) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&MasteryWord{}).
		Where("child_id = ? AND word_id IN ? AND first_mastered_at IS NOT NULL", childID, wordIDs).
		Count(&n).Error
	return n, err
}

// MasteredCountInWindow counts words first mastered inside [from, to] — the
// session's contribution, and deterministic on recompute so completion stays
// idempotent.
func (r *Repository) MasteredCountInWindow(ctx context.Context, childID uuid.UUID, wordIDs []string, from, to time.Time) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&MasteryWord{}).
		Where("child_id = ? AND word_id IN ? AND first_mastered_at BETWEEN ? AND ?", childID, wordIDs, from, to).
		Count(&n).Error
	return n, err
}

func (r *Repository) MasteredWordIDs(ctx context.Context, childID uuid.UUID) ([]string, error) {
	var ids []string
	err := r.db.WithContext(ctx).Model(&MasteryWord{}).
		Where("child_id = ? AND first_mastered_at IS NOT NULL", childID).
		Order("word_id").
		Pluck("word_id", &ids).Error
	return ids, err
}

func (r *Repository) TotalMasteredCount(ctx context.Context, childID uuid.UUID) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&MasteryWord{}).
		Where("child_id = ? AND first_mastered_at IS NOT NULL", childID).
		Count(&n).Error
	return n, err
}

func (r *Repository) MasteredSinceCount(ctx context.Context, childID uuid.UUID, since time.Time) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&MasteryWord{}).
		Where("child_id = ? AND first_mastered_at >= ?", childID, since).
		Count(&n).Error
	return n, err
}

func (r *Repository) WeakPhonemesTop(ctx context.Context, childID uuid.UUID, limit int) ([]WeakPhoneme, error) {
	var rows []WeakPhoneme
	err := r.db.WithContext(ctx).
		Where("child_id = ?", childID).
		Order("miss_count DESC, last_seen_at DESC").
		Limit(limit).
		Find(&rows).Error
	return rows, err
}

func (r *Repository) RecentAudioKeys(ctx context.Context, childID uuid.UUID, limit int) ([]string, error) {
	var keys []string
	err := r.db.WithContext(ctx).Model(&SpeechAttempt{}).
		Joins("JOIN lesson_sessions ON lesson_sessions.id = speech_attempts.session_id").
		Where("lesson_sessions.child_id = ? AND speech_attempts.audio_object_key IS NOT NULL", childID).
		Order("speech_attempts.created_at DESC").
		Limit(limit).
		Pluck("speech_attempts.audio_object_key", &keys).Error
	return keys, err
}

// PracticeDates returns the child's distinct practice days, newest first,
// using the client clock for offline attempts when available.
func (r *Repository) PracticeDates(ctx context.Context, childID uuid.UUID) ([]time.Time, error) {
	var dates []time.Time
	err := r.db.WithContext(ctx).Model(&SpeechAttempt{}).
		Joins("JOIN lesson_sessions ON lesson_sessions.id = speech_attempts.session_id").
		Where("lesson_sessions.child_id = ?", childID).
		Distinct("date_trunc('day', COALESCE(speech_attempts.recorded_at, speech_attempts.created_at))::date").
		Order("1 DESC").
		Pluck("date_trunc('day', COALESCE(speech_attempts.recorded_at, speech_attempts.created_at))::date", &dates).Error
	return dates, err
}

// --- audio retention (BACKEND_PLAN.md §12) ---

func (r *Repository) ExpiredAudio(ctx context.Context, now time.Time, limit int) ([]SpeechAttempt, error) {
	var rows []SpeechAttempt
	err := r.db.WithContext(ctx).
		Where("retain_until < ? AND audio_object_key IS NOT NULL", now).
		Limit(limit).
		Find(&rows).Error
	return rows, err
}

// ClearAudioRef nulls the object reference after the object is deleted —
// the score row survives, the recording does not.
func (r *Repository) ClearAudioRef(ctx context.Context, attemptID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&SpeechAttempt{}).
		Where("id = ?", attemptID).
		Update("audio_object_key", nil).Error
}

// --- weak phonemes ---

func (r *Repository) BumpWeakPhoneme(ctx context.Context, childID uuid.UUID, phoneme string, at time.Time) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var w WeakPhoneme
		err := tx.First(&w, "child_id = ? AND phoneme = ?", childID, phoneme).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return tx.Create(&WeakPhoneme{
				ID: uuid.New(), ChildID: childID, Phoneme: phoneme, MissCount: 1, LastSeenAt: at,
			}).Error
		}
		if err != nil {
			return err
		}
		return tx.Model(&w).Updates(map[string]any{
			"miss_count":   w.MissCount + 1,
			"last_seen_at": at,
		}).Error
	})
}
