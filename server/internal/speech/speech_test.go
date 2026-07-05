package speech

import (
	"context"
	"testing"
)

func TestFeedbackForBoundaries(t *testing.T) {
	cases := []struct {
		score float64
		want  string
	}{
		{0.95, FeedbackExcellent},
		{0.9, FeedbackExcellent},
		{0.89, FeedbackGood},
		{0.75, FeedbackGood},
		{0.74, FeedbackAlmostThere},
		{0.5, FeedbackAlmostThere},
		{0.49, FeedbackListenAndRetry},
		{0.0, FeedbackListenAndRetry},
	}
	for _, tc := range cases {
		if got := FeedbackFor(tc.score); got != tc.want {
			t.Errorf("FeedbackFor(%v) = %q, want %q", tc.score, got, tc.want)
		}
	}
}

func TestStubScorerIsDeterministicAndBounded(t *testing.T) {
	s := StubScorer{}
	audio := []byte("fake-audio-bytes")

	first, err := s.Score(context.Background(), audio, "hello")
	if err != nil {
		t.Fatal(err)
	}
	again, _ := s.Score(context.Background(), audio, "hello")
	if first != again {
		t.Errorf("stub not deterministic: %v vs %v", first, again)
	}
	if first.Score < 0.45 || first.Score > 0.98 {
		t.Errorf("score %v outside expected stub range", first.Score)
	}
	if first.FeedbackCode != FeedbackFor(first.Score) {
		t.Errorf("feedback %q inconsistent with score %v", first.FeedbackCode, first.Score)
	}

	other, _ := s.Score(context.Background(), audio, "sheep")
	if other == first {
		t.Error("different words should generally score differently")
	}
}
