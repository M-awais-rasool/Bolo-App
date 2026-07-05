package learning

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Read API consumed by other modules (reporting's digest and snapshot
// worker) through their ports — the learning tables themselves stay private
// to this package.

func (s *Service) TotalMastered(ctx context.Context, childID uuid.UUID) (int64, error) {
	return s.repo.TotalMasteredCount(ctx, childID)
}

// MasteredWordIDs is the known_words[] input to lesson generation — the only
// background vocabulary a generated lesson may assume (BACKEND_PLAN.md §7.3).
func (s *Service) MasteredWordIDs(ctx context.Context, childID uuid.UUID) ([]string, error) {
	return s.repo.MasteredWordIDs(ctx, childID)
}

// MasteredCountFor backs the content overlay's per-lesson unlock computation.
func (s *Service) MasteredCountFor(ctx context.Context, childID uuid.UUID, wordIDs []string) (int64, error) {
	return s.repo.MasteredCount(ctx, childID, wordIDs)
}

func (s *Service) MasteredSince(ctx context.Context, childID uuid.UUID, since time.Time) (int64, error) {
	return s.repo.MasteredSinceCount(ctx, childID, since)
}

func (s *Service) WeakPhonemeCodes(ctx context.Context, childID uuid.UUID, limit int) ([]string, error) {
	rows, err := s.repo.WeakPhonemesTop(ctx, childID, limit)
	if err != nil {
		return nil, err
	}
	codes := make([]string, 0, len(rows))
	for _, r := range rows {
		codes = append(codes, r.Phoneme)
	}
	return codes, nil
}

func (s *Service) RecentAudioKeys(ctx context.Context, childID uuid.UUID, limit int) ([]string, error) {
	return s.repo.RecentAudioKeys(ctx, childID, limit)
}

func (s *Service) StreakDays(ctx context.Context, childID uuid.UUID) (int, error) {
	dates, err := s.repo.PracticeDates(ctx, childID)
	if err != nil {
		return 0, err
	}
	return streakDays(dates, time.Now()), nil
}

// streakDays counts consecutive practice days ending today or yesterday
// (yesterday keeps a live streak from resetting before today's practice).
// dates must be distinct calendar days, newest first.
func streakDays(dates []time.Time, now time.Time) int {
	if len(dates) == 0 {
		return 0
	}
	day := func(t time.Time) time.Time {
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
	}
	expected := day(now)
	if !dates[0].Equal(expected) {
		expected = expected.AddDate(0, 0, -1) // streak may end yesterday
		if !day(dates[0]).Equal(expected) {
			return 0
		}
	}
	streak := 0
	for _, d := range dates {
		if !day(d).Equal(expected) {
			break
		}
		streak++
		expected = expected.AddDate(0, 0, -1)
	}
	return streak
}
