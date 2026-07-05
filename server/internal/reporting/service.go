package reporting

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const clipURLTTL = 15 * time.Minute

type Service struct {
	db        *gorm.DB
	children  ChildAccess
	learning  LearningReads
	companion CompanionReads
	clips     ClipSigner
}

func NewService(db *gorm.DB, children ChildAccess, learning LearningReads, companion CompanionReads, clips ClipSigner) *Service {
	return &Service{db: db, children: children, learning: learning, companion: companion, clips: clips}
}

// RefreshSnapshot recomputes the denormalized Home-screen row for one child.
// Runs from the mastery.updated worker, off the lesson-completion hot path
// (BACKEND_PLAN.md §9–10).
func (s *Service) RefreshSnapshot(ctx context.Context, childID uuid.UUID) error {
	words, err := s.learning.TotalMastered(ctx, childID)
	if err != nil {
		return err
	}
	streak, err := s.learning.StreakDays(ctx, childID)
	if err != nil {
		return err
	}
	stage, err := s.companion.StageForChild(ctx, childID)
	if err != nil {
		return err
	}
	snap := Snapshot{
		ChildID: childID, WordsMastered: int(words), StreakDays: streak,
		GrowthStage: stage, UpdatedAt: time.Now(),
	}
	return s.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "child_id"}},
			UpdateAll: true,
		}).
		Create(&snap).Error
}

// --- weekly digest (BACKEND_PLAN.md §6, step 12) ---

type Digest struct {
	WordsMasteredThisWeek int64    `json:"words_mastered_this_week"`
	StreakDays            int      `json:"streak_days"`
	WeakPhonemes          []string `json:"weak_phonemes"`
	SampleClips           []string `json:"sample_clips"`
	SuggestedHomePractice string   `json:"suggested_home_practice"`
}

func (s *Service) WeeklyDigest(ctx context.Context, parentID, childID uuid.UUID) (*Digest, error) {
	name, owned, err := s.children.Child(ctx, parentID, childID)
	if err != nil {
		return nil, err
	}
	if !owned {
		return nil, ErrChildNotFound
	}

	weekAgo := time.Now().AddDate(0, 0, -7)
	words, err := s.learning.MasteredSince(ctx, childID, weekAgo)
	if err != nil {
		return nil, err
	}
	streak, err := s.learning.StreakDays(ctx, childID)
	if err != nil {
		return nil, err
	}
	weak, err := s.learning.WeakPhonemeCodes(ctx, childID, 3)
	if err != nil {
		return nil, err
	}
	keys, err := s.learning.RecentAudioKeys(ctx, childID, 2)
	if err != nil {
		return nil, err
	}
	clips := make([]string, 0, len(keys))
	for _, key := range keys {
		url, err := s.clips.PresignedGet(ctx, key, clipURLTTL)
		if err != nil {
			return nil, err
		}
		clips = append(clips, url)
	}

	return &Digest{
		WordsMasteredThisWeek: words,
		StreakDays:            streak,
		WeakPhonemes:          weak,
		SampleClips:           clips,
		SuggestedHomePractice: practiceSuggestion(name, weak, words),
	}, nil
}

// practiceSuggestion is a static template, deliberately: parent-facing copy
// comes from reviewed strings, not from a model (BACKEND_PLAN.md §7.3 applies
// to parents as much as to children).
func practiceSuggestion(childName string, weakPhonemes []string, wordsThisWeek int64) string {
	switch {
	case len(weakPhonemes) > 0:
		return fmt.Sprintf("Practice the '%s' sound together — ask %s to say three words with it tonight.", weakPhonemes[0], childName)
	case wordsThisWeek > 0:
		return fmt.Sprintf("Ask %s to use this week's new words in sentences at dinner.", childName)
	default:
		return fmt.Sprintf("Do one short lesson with %s today — streaks grow fast!", childName)
	}
}
