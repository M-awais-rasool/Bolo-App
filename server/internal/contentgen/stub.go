package contentgen

import (
	"context"
	"fmt"
	"strings"

	"bolo-server/internal/content"
)

// StubGenerator is the deterministic dev/test implementation: it picks the
// first hand-written template whose ids don't collide with the category's
// existing content. Selected via CONTENTGEN_PROVIDER=stub. The templates are
// valid by construction, so the stub exercises the whole pipeline —
// validation, storage, overlay — without an API key.
type StubGenerator struct{}

var stubTemplates = []content.LessonContent{
	{
		ID: "ai-weather", Title: "Weather", Emoji: "⛅", Theme: "blue",
		Intro:  "Let's look at the sky today!",
		Prompt: "What is the weather like today? Say it out loud!",
		Words: []content.WordContent{
			{ID: "ai-weather.sun", Label: "Sun", Emoji: "☀️", Chips: []string{"The sun", "is", "bright!"}},
			{ID: "ai-weather.rain", Label: "Rain", Emoji: "🌧️", Chips: []string{"I like", "the", "rain!"}},
			{ID: "ai-weather.cloud", Label: "Cloud", Emoji: "☁️", Chips: []string{"The cloud", "is", "big!"}},
			{ID: "ai-weather.wind", Label: "Wind", Emoji: "🍃", Chips: []string{"The wind", "is", "cool!"}},
		},
		Sound: &content.SoundContent{
			Letters: "w", AsIn: "wind",
			Tip: content.SoundTip{Pre: "Make your lips ", Bold: "round like an o", Post: " and blow."},
		},
	},
	{
		ID: "ai-school", Title: "School", Emoji: "🎒", Theme: "gold",
		Intro:  "Let's get ready for school!",
		Prompt: "What do you take to school? Say it out loud!",
		Words: []content.WordContent{
			{ID: "ai-school.book", Label: "Book", Emoji: "📖", Chips: []string{"I read", "my", "book!"}},
			{ID: "ai-school.pen", Label: "Pen", Emoji: "🖊️", Chips: []string{"I write", "with a", "pen!"}},
			{ID: "ai-school.bag", Label: "Bag", Emoji: "🎒", Chips: []string{"My bag", "is", "green!"}},
			{ID: "ai-school.desk", Label: "Desk", Emoji: "🪑", Chips: []string{"I sit", "at my", "desk!"}},
		},
	},
	{
		ID: "ai-garden", Title: "Garden", Emoji: "🌷", Theme: "green",
		Intro:  "Let's play in the garden!",
		Prompt: "What do you see in the garden? Say it out loud!",
		Words: []content.WordContent{
			{ID: "ai-garden.flower", Label: "Flower", Emoji: "🌸", Chips: []string{"The flower", "is", "pink!"}},
			{ID: "ai-garden.tree", Label: "Tree", Emoji: "🌳", Chips: []string{"The tree", "is", "tall!"}},
			{ID: "ai-garden.bee", Label: "Bee", Emoji: "🐝", Chips: []string{"The bee", "is", "busy!"}},
			{ID: "ai-garden.grass", Label: "Grass", Emoji: "🌿", Chips: []string{"The grass", "is", "soft!"}},
		},
	},
}

func (StubGenerator) Generate(_ context.Context, gc GenContext) (*content.LessonContent, error) {
	taken := map[string]bool{}
	for _, id := range gc.ExistingWordIDs {
		taken[id] = true
	}
	for _, id := range gc.ExistingLessons {
		taken[strings.ToLower(id)] = true
	}
	for _, template := range stubTemplates {
		if taken[strings.ToLower(template.ID)] {
			continue
		}
		collision := false
		for _, w := range template.Words {
			if taken[w.ID] {
				collision = true
				break
			}
		}
		if !collision {
			lesson := template // copy
			return &lesson, nil
		}
	}
	return nil, fmt.Errorf("stub generator exhausted its %d templates for %s", len(stubTemplates), gc.CategoryCode)
}
