package content

import (
	"strings"
	"testing"
)

func validPack() *ContentPack {
	return &ContentPack{
		SchemaVersion: 1,
		Revision:      1,
		Lessons: []LessonContent{
			{
				ID: "greetings", Title: "Greetings", Emoji: "👋", Theme: "green",
				Intro: "Let's say hello!", Prompt: "What do you say?",
				Words: []WordContent{
					{ID: "greetings.hello", Label: "Hello", Emoji: "👋", Chips: []string{"Hello,", "nice to", "meet you!"}},
				},
				Sound: &SoundContent{Letters: "th", AsIn: "thank", Tip: SoundTip{Pre: "a", Bold: "b", Post: "c"}},
			},
		},
	}
}

func TestValidatePassesOnValidPack(t *testing.T) {
	if err := validPack().Validate(); err != nil {
		t.Fatalf("expected valid pack, got %v", err)
	}
}

func TestValidateRejections(t *testing.T) {
	cases := []struct {
		name    string
		mutate  func(*ContentPack)
		wantErr string
	}{
		{"wrong schema version", func(p *ContentPack) { p.SchemaVersion = 2 }, "schemaVersion"},
		{"zero revision", func(p *ContentPack) { p.Revision = 0 }, "revision"},
		{"no lessons", func(p *ContentPack) { p.Lessons = nil }, "no lessons"},
		{"unknown theme", func(p *ContentPack) { p.Lessons[0].Theme = "magenta" }, "unknown theme"},
		{"missing intro", func(p *ContentPack) { p.Lessons[0].Intro = "" }, "required"},
		{"no words", func(p *ContentPack) { p.Lessons[0].Words = nil }, "no words"},
		{"un-namespaced word id", func(p *ContentPack) { p.Lessons[0].Words[0].ID = "hello" }, "namespaced"},
		{"two chips", func(p *ContentPack) { p.Lessons[0].Words[0].Chips = []string{"a", "b"} }, "exactly 3"},
		{"empty chip", func(p *ContentPack) { p.Lessons[0].Words[0].Chips = []string{"a", "", "c"} }, "non-empty"},
		{"sound missing bold", func(p *ContentPack) { p.Lessons[0].Sound.Tip.Bold = "" }, "tip.bold"},
		{"duplicate lesson id", func(p *ContentPack) {
			p.Lessons = append(p.Lessons, p.Lessons[0])
		}, "duplicate"},
	}
	for _, tc := range cases {
		p := validPack()
		tc.mutate(p)
		err := p.Validate()
		if err == nil {
			t.Errorf("%s: expected error, got nil", tc.name)
			continue
		}
		if !strings.Contains(err.Error(), tc.wantErr) {
			t.Errorf("%s: error %q does not mention %q", tc.name, err, tc.wantErr)
		}
	}
}
