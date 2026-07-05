// Package speech is the stateless scoring capability (BACKEND_PLAN.md §1):
// it wraps whichever pronunciation-scoring vendor is configured behind one
// interface, so evaluating or switching vendors never touches the learning
// module. The v1 decision is buy-not-build (§2) — the only implementation
// shipped here is the deterministic dev stub.
package speech

import (
	"context"
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"math"
)

type Result struct {
	Score        float64
	FeedbackCode string
}

type Scorer interface {
	// Score rates one utterance of `word` (audio is the raw recording).
	Score(ctx context.Context, audio []byte, word string) (Result, error)
}

// Feedback codes are a small fixed enum (BACKEND_PLAN.md §6 step 9): the
// client maps each code to a reviewed line in the companion's own voice.
// Raw vendor/model output is never spoken to a child — new codes require a
// client release, which is exactly the friction we want.
const (
	FeedbackExcellent      = "excellent"
	FeedbackGood           = "good"
	FeedbackAlmostThere    = "almost_there"
	FeedbackListenAndRetry = "listen_and_retry"
)

func FeedbackFor(score float64) string {
	switch {
	case score >= 0.9:
		return FeedbackExcellent
	case score >= 0.75:
		return FeedbackGood
	case score >= 0.5:
		return FeedbackAlmostThere
	default:
		return FeedbackListenAndRetry
	}
}

// StubScorer is the development/test implementation: deterministic (same
// audio + word always scores the same) and biased toward encouraging scores,
// like a child-tuned vendor would be. Selected via SPEECH_SCORER=stub; a real
// vendor adapter replaces it behind the same interface after the vendor
// bake-off against Urdu-accented child speech (BACKEND_PLAN.md §2).
type StubScorer struct{}

func (StubScorer) Score(_ context.Context, audio []byte, word string) (Result, error) {
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s|%d", word, len(audio))))
	frac := float64(binary.BigEndian.Uint16(sum[:2])) / 65535.0
	score := math.Round((0.45+0.53*frac)*100) / 100
	return Result{Score: score, FeedbackCode: FeedbackFor(score)}, nil
}
