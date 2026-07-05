package contentgen

import (
	"fmt"
	"regexp"
	"strings"

	"bolo-server/internal/content"
)

// Verdict is the validation layer's decision (BACKEND_PLAN.md §7.2 step 6):
// approve auto-publishes, needs-review queues for a human, reject discards.
type Verdict int

const (
	VerdictApprove Verdict = iota
	VerdictNeedsReview
	VerdictReject
)

func (v Verdict) String() string {
	switch v {
	case VerdictApprove:
		return "approve"
	case VerdictNeedsReview:
		return "needs_review"
	default:
		return "reject"
	}
}

// Hard safety floor: any hit is an outright reject. Personal questions are
// rejected because the product never asks a child for personal information.
var (
	bannedWords = []string{
		"kill", "die", "dead", "gun", "knife", "blood", "hate", "stupid",
		"dumb", "ugly", "scary", "monster", "hurt", "fight", "war",
	}
	personalQuestionPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)your (name|address|home|house|school name|phone|number)`),
		regexp.MustCompile(`(?i)where (do you live|is your)`),
		regexp.MustCompile(`(?i)(secret|password|don't tell)`),
	}
)

// Common function words allowed as connective tissue around the target
// vocabulary — check (b) tolerates these without flagging.
var functionWords = map[string]bool{
	"a": true, "an": true, "the": true, "i": true, "you": true, "we": true,
	"my": true, "your": true, "is": true, "are": true, "am": true, "it": true,
	"this": true, "that": true, "and": true, "or": true, "to": true, "in": true,
	"on": true, "at": true, "with": true, "like": true, "love": true, "see": true,
	"look": true, "what": true, "do": true, "can": true, "let's": true, "so": true,
	"very": true, "big": true, "little": true, "out": true, "loud": true, "say": true,
	"today": true, "now": true, "here": true, "for": true, "of": true, "me": true,
}

// Per-category reading-level ceilings (check d): sentence length in words.
var maxSentenceWords = map[string]int{"KG": 8, "G1": 10, "G2": 12, "G3": 16, "G4": 20}

// Validate runs the four checks from BACKEND_PLAN.md §7.2 over a generated
// lesson. Hard violations (schema, id reuse, safety) reject; heuristic ones
// (vocabulary scope, reading level) queue for human review — a false alarm
// costs a reviewer minutes, a false pass would reach a child.
func Validate(lesson *content.LessonContent, gc GenContext) (Verdict, []string) {
	var reviewReasons []string

	// (a) schema — exact client contract, reusing the pack validator.
	shell := content.ContentPack{SchemaVersion: 1, Revision: 1, Lessons: []content.LessonContent{*lesson}}
	if err := shell.Validate(); err != nil {
		return VerdictReject, []string{fmt.Sprintf("schema: %v", err)}
	}

	// (b) vocabulary scope — ids must be genuinely new, word count bounded.
	existing := map[string]bool{}
	for _, id := range gc.ExistingWordIDs {
		existing[strings.ToLower(id)] = true
	}
	for _, id := range gc.ExistingLessons {
		existing[strings.ToLower(id)] = true
	}
	if existing[strings.ToLower(lesson.ID)] {
		return VerdictReject, []string{fmt.Sprintf("vocab: lesson id %q already exists", lesson.ID)}
	}
	for _, w := range lesson.Words {
		if existing[strings.ToLower(w.ID)] {
			return VerdictReject, []string{fmt.Sprintf("vocab: word id %q already exists", w.ID)}
		}
	}
	if len(lesson.Words) < 3 || len(lesson.Words) > 5 {
		if gc.Reason != "remedial" || len(lesson.Words) > 5 {
			return VerdictReject, []string{fmt.Sprintf("vocab: %d new words, want 3-5", len(lesson.Words))}
		}
	}
	if unknown := outOfScopeTokens(lesson, gc); len(unknown) > 0 {
		reviewReasons = append(reviewReasons,
			fmt.Sprintf("vocab: uses words outside known+new scope: %s", strings.Join(unknown, ", ")))
	}

	// (c) safety — banned list and personal questions across all child-facing text.
	for _, text := range childFacingText(lesson) {
		lower := strings.ToLower(text)
		for _, banned := range bannedWords {
			if containsWord(lower, banned) {
				return VerdictReject, []string{fmt.Sprintf("safety: banned word %q in %q", banned, text)}
			}
		}
		for _, pattern := range personalQuestionPatterns {
			if pattern.MatchString(text) {
				return VerdictReject, []string{fmt.Sprintf("safety: personal question in %q", text)}
			}
		}
	}

	// (d) reading level — per-sentence length fits the category profile
	// (a text block may hold several short sentences, like the seed content).
	limit := maxSentenceWords[gc.CategoryCode]
	if limit == 0 {
		limit = 12
	}
	for _, text := range childFacingText(lesson) {
		for _, sentence := range sentenceSplit.Split(text, -1) {
			if n := len(strings.Fields(sentence)); n > limit {
				reviewReasons = append(reviewReasons,
					fmt.Sprintf("reading level: %d-word sentence (max %d for %s) in %q", n, limit, gc.CategoryCode, text))
			}
		}
	}

	if len(reviewReasons) > 0 {
		return VerdictNeedsReview, reviewReasons
	}
	return VerdictApprove, nil
}

func childFacingText(lesson *content.LessonContent) []string {
	texts := []string{lesson.Intro, lesson.Prompt}
	for _, w := range lesson.Words {
		texts = append(texts, strings.Join(w.Chips[:], " "))
	}
	if lesson.Sound != nil {
		texts = append(texts, lesson.Sound.Tip.Pre+lesson.Sound.Tip.Bold+lesson.Sound.Tip.Post)
	}
	return texts
}

// outOfScopeTokens flags content words that are neither the child's known
// vocabulary, the lesson's new words, nor common function words. Heuristic —
// label extraction from word ids is approximate — hence review, not reject.
func outOfScopeTokens(lesson *content.LessonContent, gc GenContext) []string {
	allowed := map[string]bool{}
	for word := range functionWords {
		allowed[word] = true
	}
	for _, id := range gc.KnownWordIDs {
		if _, suffix, ok := strings.Cut(id, "."); ok {
			allowed[strings.ToLower(suffix)] = true
		}
	}
	for _, w := range lesson.Words {
		for _, token := range tokenize(w.Label) {
			allowed[token] = true
		}
	}
	allowed[strings.ToLower(lesson.Title)] = true

	seen := map[string]bool{}
	var unknown []string
	for _, text := range childFacingText(lesson) {
		for _, token := range tokenize(text) {
			if !allowed[token] && !seen[token] {
				seen[token] = true
				unknown = append(unknown, token)
			}
		}
	}
	return unknown
}

var (
	nonLetter     = regexp.MustCompile(`[^a-z']+`)
	sentenceSplit = regexp.MustCompile(`[.!?]+`)
)

func tokenize(text string) []string {
	var tokens []string
	for _, raw := range nonLetter.Split(strings.ToLower(text), -1) {
		if raw = strings.Trim(raw, "'"); raw != "" {
			tokens = append(tokens, raw)
		}
	}
	return tokens
}

func containsWord(lowerText, word string) bool {
	for _, token := range tokenize(lowerText) {
		if token == word {
			return true
		}
	}
	return false
}
