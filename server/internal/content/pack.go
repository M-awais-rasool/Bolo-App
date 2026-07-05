// Package content owns packs, lessons, and versioning — the `content`
// bounded context (BACKEND_PLAN.md §1, §4).
package content

import (
	"fmt"
	"strings"
)

// ContentPack mirrors the client's ContentPack type
// (Bolo/src/content/types.ts) field for field. That file is the canonical
// contract: the backend stores, validates, and generates exactly this shape —
// two schemas would mean drift (BACKEND_PLAN.md §4.1).
type ContentPack struct {
	SchemaVersion int             `json:"schemaVersion"`
	Revision      int             `json:"revision"`
	Lessons       []LessonContent `json:"lessons"`
}

type LessonContent struct {
	ID     string        `json:"id"`
	Title  string        `json:"title"`
	Emoji  string        `json:"emoji"`
	Theme  string        `json:"theme"`
	Intro  string        `json:"intro"`
	Prompt string        `json:"prompt"`
	Words  []WordContent `json:"words"`
	Sound  *SoundContent `json:"sound,omitempty"`
}

type WordContent struct {
	ID    string   `json:"id"`
	Label string   `json:"label"`
	Emoji string   `json:"emoji"`
	Chips []string `json:"chips"`
}

type SoundContent struct {
	Letters string   `json:"letters"`
	AsIn    string   `json:"asIn"`
	Tip     SoundTip `json:"tip"`
}

type SoundTip struct {
	Pre  string `json:"pre"`
	Bold string `json:"bold"`
	Post string `json:"post"`
}

const supportedSchemaVersion = 1

// Theme keys the client can render (LessonThemeKey in the app).
var validThemes = map[string]bool{
	"green": true, "purple": true, "coral": true, "gold": true, "pink": true, "blue": true,
}

// Validate enforces the client contract. Every pack — seed or AI-generated —
// passes through here before it can be stored or published; this is check (a)
// of the generation validation layer (BACKEND_PLAN.md §7.2).
func (p *ContentPack) Validate() error {
	if p.SchemaVersion != supportedSchemaVersion {
		return fmt.Errorf("schemaVersion must be %d, got %d", supportedSchemaVersion, p.SchemaVersion)
	}
	if p.Revision < 1 {
		return fmt.Errorf("revision must be >= 1, got %d", p.Revision)
	}
	if len(p.Lessons) == 0 {
		return fmt.Errorf("pack has no lessons")
	}

	lessonIDs := map[string]bool{}
	wordIDs := map[string]bool{}
	for i, l := range p.Lessons {
		where := fmt.Sprintf("lesson[%d] (%q)", i, l.ID)
		if l.ID == "" || l.Title == "" || l.Emoji == "" || l.Intro == "" || l.Prompt == "" {
			return fmt.Errorf("%s: id, title, emoji, intro, and prompt are all required", where)
		}
		if lessonIDs[l.ID] {
			return fmt.Errorf("%s: duplicate lesson id", where)
		}
		lessonIDs[l.ID] = true
		if !validThemes[l.Theme] {
			return fmt.Errorf("%s: unknown theme %q", where, l.Theme)
		}
		if len(l.Words) == 0 {
			return fmt.Errorf("%s: lesson has no words", where)
		}
		for j, w := range l.Words {
			wordWhere := fmt.Sprintf("%s word[%d] (%q)", where, j, w.ID)
			if w.ID == "" || w.Label == "" || w.Emoji == "" {
				return fmt.Errorf("%s: id, label, and emoji are required", wordWhere)
			}
			// Namespaced, never-reused word ids are what make progress
			// records safe to sync (Bolo/ARCHITECTURE.md).
			if !strings.HasPrefix(w.ID, l.ID+".") {
				return fmt.Errorf("%s: word id must be namespaced under %q", wordWhere, l.ID+".")
			}
			if wordIDs[w.ID] {
				return fmt.Errorf("%s: duplicate word id", wordWhere)
			}
			wordIDs[w.ID] = true
			if len(w.Chips) != 3 {
				return fmt.Errorf("%s: chips must have exactly 3 entries, got %d", wordWhere, len(w.Chips))
			}
			for _, chip := range w.Chips {
				if chip == "" {
					return fmt.Errorf("%s: chips must be non-empty", wordWhere)
				}
			}
		}
		if l.Sound != nil {
			if l.Sound.Letters == "" || l.Sound.AsIn == "" || l.Sound.Tip.Bold == "" {
				return fmt.Errorf("%s: sound needs letters, asIn, and tip.bold", where)
			}
		}
	}
	return nil
}
