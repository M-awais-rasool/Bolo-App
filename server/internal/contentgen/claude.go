package contentgen

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"

	"bolo-server/internal/content"
)

// ClaudeGenerator authors lessons with Claude via the official Go SDK.
// Selected with CONTENTGEN_PROVIDER=anthropic + ANTHROPIC_API_KEY. The model
// only ever produces structured lesson JSON offline — its output goes through
// the validation layer and, when borderline, human review before any child
// sees it (BACKEND_PLAN.md §7.3).
type ClaudeGenerator struct {
	client anthropic.Client
	model  anthropic.Model
}

func NewClaudeGenerator(apiKey, model string) *ClaudeGenerator {
	return &ClaudeGenerator{
		client: anthropic.NewClient(option.WithAPIKey(apiKey)),
		model:  anthropic.Model(model),
	}
}

const systemPrompt = `You author one English-speaking-practice lesson for a young child learning English as a second language. You write structured lesson data for review — you never talk to the child.

Return ONLY a JSON object with exactly this shape, no prose and no markdown fences:
{"id":"ai-<kebab-topic>","title":"<Topic>","emoji":"<one emoji>","theme":"<green|purple|coral|gold|pink|blue>","intro":"<companion's one-line intro>","prompt":"<companion's one question>","words":[{"id":"ai-<kebab-topic>.<word>","label":"<Word>","emoji":"<one emoji>","chips":["<part 1>","<part 2>","<part 3>"]}],"sound":{"letters":"<phoneme>","asIn":"<example word>","tip":{"pre":"<text before>","bold":"<key phrase>","post":"<text after>"}}}

Hard rules:
- 3 to 5 new words. Every word id must start with the lesson id plus a dot.
- chips is exactly 3 short fragments that join into one simple spoken sentence.
- Background vocabulary is LIMITED to the child's known words provided below plus very common function words. New vocabulary is only your 3-5 target words.
- Never reuse any existing lesson id or word id provided below.
- Warm, playful, concrete, everyday topics. No scary, violent, or sad content. Never ask the child anything personal (name, home, family details, secrets).
- "sound" is optional — include it only when one phoneme genuinely fits the words.`

func (g *ClaudeGenerator) Generate(ctx context.Context, gc GenContext) (*content.LessonContent, error) {
	userPrompt := fmt.Sprintf(
		`Category: %s (see difficulty guide). Reason: %s.
Child's known word ids (background vocabulary): %s
Existing lesson ids (never reuse): %s
Existing word ids (never reuse): %s
Weak phonemes to gently favor: %s
Companion species (voice for intro/prompt): %s

Difficulty guide: KG = single words and 3-word sentences; G1 = short phrases; G2 = full simple sentences; G3 = multi-sentence answers; G4 = short conversations.

Author the lesson now.`,
		gc.CategoryCode, gc.Reason,
		strings.Join(gc.KnownWordIDs, ", "),
		strings.Join(gc.ExistingLessons, ", "),
		strings.Join(gc.ExistingWordIDs, ", "),
		strings.Join(gc.WeakPhonemes, ", "),
		gc.CompanionSpecies,
	)

	adaptive := anthropic.ThinkingConfigAdaptiveParam{}
	response, err := g.client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     g.model,
		MaxTokens: 4096,
		Thinking:  anthropic.ThinkingConfigParamUnion{OfAdaptive: &adaptive},
		System:    []anthropic.TextBlockParam{{Text: systemPrompt}},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(userPrompt)),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("anthropic: %w", err)
	}

	var text string
	for _, block := range response.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			text += b.Text
		}
	}
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")

	var lesson content.LessonContent
	if err := json.Unmarshal([]byte(strings.TrimSpace(text)), &lesson); err != nil {
		return nil, fmt.Errorf("model returned unparseable lesson JSON: %w", err)
	}
	return &lesson, nil
}
