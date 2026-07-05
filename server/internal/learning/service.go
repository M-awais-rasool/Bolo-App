package learning

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/google/uuid"

	"bolo-server/internal/content"
	"bolo-server/internal/speech"
)

// Mastery thresholds. A word is mastered the first time an attempt reaches
// MasteryThreshold; below WeakThreshold the lesson's drill phoneme (if any)
// is recorded as a miss — the signal the remedial generator reads in M4.
const (
	MasteryThreshold = 0.75
	WeakThreshold    = 0.5
)

// Dependencies on other modules go through narrow interfaces so the module
// boundary stays a compile-time fact (BACKEND_PLAN.md §1). The adapters live
// in the composition root (cmd/api).
type (
	// ChildAccess proves parent→child ownership and yields the child's
	// category; implementations must return ErrChildNotFound for children
	// the parent doesn't own.
	ChildAccess interface {
		ChildCategory(ctx context.Context, parentID, childID uuid.UUID) (string, error)
	}

	Catalog interface {
		Lesson(ctx context.Context, categoryCode, clientID string) (*content.LessonInfo, error)
		LessonAfter(ctx context.Context, categoryCode string, orderIndex int) (*content.LessonInfo, error)
	}

	// AudioStore writes to the private audio bucket — never the public
	// packs bucket (BACKEND_PLAN.md §12).
	AudioStore interface {
		Put(ctx context.Context, key string, data []byte, contentType string) error
	}
)

type Service struct {
	repo           *Repository
	children       ChildAccess
	catalog        Catalog
	scorer         speech.Scorer
	audio          AudioStore
	audioRetention time.Duration
}

func NewService(repo *Repository, children ChildAccess, catalog Catalog, scorer speech.Scorer, audio AudioStore, audioRetention time.Duration) *Service {
	return &Service{
		repo: repo, children: children, catalog: catalog,
		scorer: scorer, audio: audio, audioRetention: audioRetention,
	}
}

// --- sessions ---

// StartSession is idempotent on (child, client_key): a retried request
// returns the session it already created.
func (s *Service) StartSession(ctx context.Context, parentID, childID uuid.UUID, lessonClientID, clientKey string) (*LessonSession, error) {
	categoryCode, err := s.children.ChildCategory(ctx, parentID, childID)
	if err != nil {
		return nil, err
	}
	if existing, err := s.repo.SessionByClientKey(ctx, childID, clientKey); err == nil {
		return existing, nil
	} else if !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	if _, err := s.catalog.Lesson(ctx, categoryCode, lessonClientID); err != nil {
		if errors.Is(err, content.ErrLessonNotFound) {
			return nil, ErrLessonNotFound
		}
		return nil, err
	}
	session := &LessonSession{
		ID: uuid.New(), ChildID: childID, CategoryCode: categoryCode,
		LessonClientID: lessonClientID, ClientKey: clientKey,
		Status: SessionActive, StartedAt: time.Now(),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

// SessionForParent resolves a session only if the ownership chain
// parent → child → session holds; anything else is ErrSessionNotFound, so
// the API never confirms that someone else's session id exists.
func (s *Service) SessionForParent(ctx context.Context, parentID, sessionID uuid.UUID) (*LessonSession, error) {
	session, err := s.repo.SessionByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	if _, err := s.children.ChildCategory(ctx, parentID, session.ChildID); err != nil {
		if errors.Is(err, ErrChildNotFound) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	return session, nil
}

// --- attempts ---

// RecordAttempt scores one utterance and folds it into the mastery graph.
// Idempotent on (session, client_key): a retry returns the stored result
// without re-scoring or double-counting (BACKEND_PLAN.md §11). recordedAt is
// the client clock for offline-synced attempts, nil for live ones.
func (s *Service) RecordAttempt(ctx context.Context, session *LessonSession, wordID, clientKey string, audio []byte, recordedAt *time.Time) (attempt *SpeechAttempt, duplicate bool, err error) {
	if existing, err := s.repo.AttemptByClientKey(ctx, session.ID, clientKey); err == nil {
		return existing, true, nil
	} else if !errors.Is(err, ErrNotFound) {
		return nil, false, err
	}
	if len(audio) == 0 {
		return nil, false, ErrAudioRequired
	}

	lesson, err := s.catalog.Lesson(ctx, session.CategoryCode, session.LessonClientID)
	if err != nil {
		if errors.Is(err, content.ErrLessonNotFound) {
			return nil, false, ErrLessonNotFound
		}
		return nil, false, err
	}
	if !slices.Contains(lesson.WordIDs, wordID) {
		return nil, false, ErrWordNotInLesson
	}

	result, err := s.scorer.Score(ctx, audio, wordID)
	if err != nil {
		return nil, false, fmt.Errorf("scoring: %w", err)
	}

	now := time.Now()
	attempt = &SpeechAttempt{
		ID: uuid.New(), SessionID: session.ID, WordID: wordID,
		Score: result.Score, FeedbackCode: result.FeedbackCode,
		ClientKey: clientKey, RecordedAt: recordedAt,
		RetainUntil: now.Add(s.audioRetention),
	}
	key := fmt.Sprintf("audio/%s/%s/%s", session.ChildID, session.ID, attempt.ID)
	if err := s.audio.Put(ctx, key, audio, "application/octet-stream"); err != nil {
		return nil, false, fmt.Errorf("store audio: %w", err)
	}
	attempt.AudioObjectKey = &key

	if err := s.repo.CreateAttempt(ctx, attempt); err != nil {
		// Lost a race with a concurrent retry of the same client_key —
		// the stored attempt is the answer.
		if existing, lookupErr := s.repo.AttemptByClientKey(ctx, session.ID, clientKey); lookupErr == nil {
			return existing, true, nil
		}
		return nil, false, err
	}

	if err := s.repo.UpsertMastery(ctx, session.ChildID, wordID, result.Score, MasteryThreshold, now); err != nil {
		return nil, false, err
	}
	if result.Score < WeakThreshold && lesson.SoundLetters != "" {
		if err := s.repo.BumpWeakPhoneme(ctx, session.ChildID, lesson.SoundLetters, now); err != nil {
			return nil, false, err
		}
	}
	return attempt, false, nil
}

// --- completion ---

type SessionSummary struct {
	LessonMastered           bool
	WordsMasteredDelta       int64
	NextLessonUnlocked       *string
	CompanionGrowthTriggered bool // wired to the mastery.updated job in M3
}

// CompleteSession is idempotent by session state: the first call freezes
// completed_at, and every retry recomputes the same summary from that window.
func (s *Service) CompleteSession(ctx context.Context, session *LessonSession) (*SessionSummary, error) {
	if session.Status == SessionActive {
		now := time.Now()
		if err := s.repo.MarkSessionCompleted(ctx, session.ID, now); err != nil {
			return nil, err
		}
		// Re-read: a concurrent retry may have completed it first with an
		// earlier timestamp, and that one is the truth.
		fresh, err := s.repo.SessionByID(ctx, session.ID)
		if err != nil {
			return nil, err
		}
		session = fresh
	}
	if session.CompletedAt == nil {
		return nil, fmt.Errorf("session %s completed without timestamp", session.ID)
	}

	lesson, err := s.catalog.Lesson(ctx, session.CategoryCode, session.LessonClientID)
	if err != nil {
		if errors.Is(err, content.ErrLessonNotFound) {
			return nil, ErrLessonNotFound
		}
		return nil, err
	}

	mastered, err := s.repo.MasteredCount(ctx, session.ChildID, lesson.WordIDs)
	if err != nil {
		return nil, err
	}
	delta, err := s.repo.MasteredCountInWindow(ctx, session.ChildID, lesson.WordIDs, session.StartedAt, *session.CompletedAt)
	if err != nil {
		return nil, err
	}

	summary := &SessionSummary{
		LessonMastered:     mastered == int64(len(lesson.WordIDs)),
		WordsMasteredDelta: delta,
	}
	if summary.LessonMastered {
		next, err := s.catalog.LessonAfter(ctx, session.CategoryCode, lesson.OrderIndex)
		switch {
		case err == nil:
			summary.NextLessonUnlocked = &next.ClientID
		case errors.Is(err, content.ErrLessonNotFound):
			// End of the curriculum — the M4 generation trigger fires here.
		default:
			return nil, err
		}
	}
	return summary, nil
}

// --- offline sync ---

type SyncItem struct {
	ClientKey  string
	SessionID  uuid.UUID
	WordID     string
	RecordedAt time.Time
	Audio      []byte
}

type SyncItemResult struct {
	ClientKey    string
	Status       string // synced | duplicate | conflict
	ErrorCode    string // set when Status == conflict
	Score        float64
	FeedbackCode string
}

// SyncAttempts scores a batch of offline-queued attempts (BACKEND_PLAN.md
// §11). Items fail individually — one bad item never blocks the rest of a
// child's queue from syncing.
func (s *Service) SyncAttempts(ctx context.Context, parentID uuid.UUID, items []SyncItem) []SyncItemResult {
	results := make([]SyncItemResult, 0, len(items))
	for _, item := range items {
		res := SyncItemResult{ClientKey: item.ClientKey}
		session, err := s.SessionForParent(ctx, parentID, item.SessionID)
		if err != nil {
			res.Status, res.ErrorCode = "conflict", "session_not_found"
			results = append(results, res)
			continue
		}
		recordedAt := item.RecordedAt
		attempt, duplicate, err := s.RecordAttempt(ctx, session, item.WordID, item.ClientKey, item.Audio, &recordedAt)
		switch {
		case errors.Is(err, ErrWordNotInLesson):
			res.Status, res.ErrorCode = "conflict", "word_not_in_lesson"
		case errors.Is(err, ErrAudioRequired):
			res.Status, res.ErrorCode = "conflict", "audio_required"
		case err != nil:
			res.Status, res.ErrorCode = "conflict", "internal_error"
		case duplicate:
			res.Status, res.Score, res.FeedbackCode = "duplicate", attempt.Score, attempt.FeedbackCode
		default:
			res.Status, res.Score, res.FeedbackCode = "synced", attempt.Score, attempt.FeedbackCode
		}
		results = append(results, res)
	}
	return results
}
