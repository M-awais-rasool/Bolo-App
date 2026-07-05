package contentgen

import (
	"strings"
	"testing"

	"bolo-server/internal/content"
)

func genContext() GenContext {
	return GenContext{
		CategoryCode:    "KG",
		Reason:          "curriculum_exhausted",
		KnownWordIDs:    []string{"colors.red", "colors.blue", "greetings.hello"},
		ExistingWordIDs: []string{"colors.red", "colors.blue", "greetings.hello"},
		ExistingLessons: []string{"colors", "greetings"},
	}
}

func validLesson() *content.LessonContent {
	return &content.LessonContent{
		ID: "ai-weather", Title: "Weather", Emoji: "⛅", Theme: "blue",
		Intro:  "Hello! I see the sun today!",
		Prompt: "What do you see today? Say it out loud!",
		Words: []content.WordContent{
			{ID: "ai-weather.sun", Label: "Sun", Emoji: "☀️", Chips: []string{"The sun", "is", "big!"}},
			{ID: "ai-weather.rain", Label: "Rain", Emoji: "🌧️", Chips: []string{"I like", "the", "rain!"}},
			{ID: "ai-weather.cloud", Label: "Cloud", Emoji: "☁️", Chips: []string{"The cloud", "is", "little!"}},
		},
	}
}

func TestValidateApprovesCleanLesson(t *testing.T) {
	verdict, reasons := Validate(validLesson(), genContext())
	if verdict != VerdictApprove {
		t.Fatalf("want approve, got %s: %v", verdict, reasons)
	}
}

func TestValidateRejects(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*content.LessonContent)
		want   string
	}{
		{"broken schema (two chips)", func(l *content.LessonContent) {
			l.Words[0].Chips = []string{"a", "b"}
		}, "schema"},
		{"reused word id", func(l *content.LessonContent) {
			l.Words[0].ID = "ai-weather.sun"
			l.ID = "ai-weather"
			// simulate collision with existing content
		}, ""},
		{"banned word", func(l *content.LessonContent) {
			l.Intro = "The scary monster is here!"
		}, "safety"},
		{"personal question", func(l *content.LessonContent) {
			l.Prompt = "What is your name and where do you live?"
		}, "safety"},
		{"too many new words", func(l *content.LessonContent) {
			for i := 0; i < 3; i++ {
				l.Words = append(l.Words, content.WordContent{
					ID: "ai-weather.extra" + strings.Repeat("x", i+1), Label: "Extra", Emoji: "✨",
					Chips: []string{"a", "b", "c"},
				})
			}
		}, "vocab"},
	}
	for _, tc := range cases {
		lesson := validLesson()
		gc := genContext()
		if tc.name == "reused word id" {
			gc.ExistingWordIDs = append(gc.ExistingWordIDs, "ai-weather.sun")
		}
		tc.mutate(lesson)
		verdict, reasons := Validate(lesson, gc)
		if verdict != VerdictReject {
			t.Errorf("%s: want reject, got %s (%v)", tc.name, verdict, reasons)
			continue
		}
		if tc.want != "" && (len(reasons) == 0 || !strings.Contains(reasons[0], tc.want)) {
			t.Errorf("%s: reason %v does not mention %q", tc.name, reasons, tc.want)
		}
	}
}

func TestValidateQueuesBorderlineForReview(t *testing.T) {
	// Out-of-scope vocabulary → review, not reject.
	lesson := validLesson()
	lesson.Intro = "The magnificent stratosphere shimmers above!"
	verdict, reasons := Validate(lesson, genContext())
	if verdict != VerdictNeedsReview {
		t.Fatalf("want needs_review, got %s: %v", verdict, reasons)
	}

	// Over-long sentence for KG → review.
	lesson = validLesson()
	lesson.Prompt = "What do you see up in the sky today and what do you like the most about it all?"
	verdict, _ = Validate(lesson, genContext())
	if verdict != VerdictNeedsReview {
		t.Fatalf("want needs_review for long sentence, got %s", verdict)
	}
}

func TestStubGeneratorSkipsCollisions(t *testing.T) {
	gc := genContext()
	gc.ExistingLessons = append(gc.ExistingLessons, "ai-weather")
	lesson, err := StubGenerator{}.Generate(t.Context(), gc)
	if err != nil {
		t.Fatal(err)
	}
	if lesson.ID == "ai-weather" {
		t.Error("stub reused an existing lesson id")
	}
	if verdict, reasons := Validate(lesson, gc); verdict == VerdictReject {
		t.Errorf("stub lesson rejected by validation: %v", reasons)
	}
}
