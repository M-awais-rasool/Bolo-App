// Package companion owns the child's companion: species choice and growth
// stages — the `companion` bounded context (BACKEND_PLAN.md §1).
package companion

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Companion struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey"`
	ChildID            uuid.UUID `gorm:"type:uuid"`
	Species            string
	GrowthStage        string
	WordsMasteredCount int
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

func (Companion) TableName() string { return "companions" }

var (
	ErrChildNotFound     = errors.New("child not found")
	ErrCompanionNotFound = errors.New("companion not found")
	ErrUnknownSpecies    = errors.New("unknown species")
	ErrSpeciesConflict   = errors.New("child already has a different companion")
)

// Species the client can render (Bolo/src/content/progression.ts).
var validSpecies = map[string]bool{"mano": true, "pip": true, "zizi": true}

// Growth stages are stable codes with word-count thresholds; display labels
// ("Young Fox", "Brave Chick") live client-side in progression.ts. `egg`
// covers the pre-hatch state before the first-10-words milestone.
type stage struct {
	Code string
	At   int
}

var stages = []stage{
	{"egg", 0}, {"hatchling", 10}, {"young", 50}, {"brave", 120}, {"wise", 220}, {"star", 350},
}

const StageEgg = "egg"

func StageFor(wordsMastered int) string {
	current := stages[0].Code
	for _, s := range stages {
		if wordsMastered >= s.At {
			current = s.Code
		}
	}
	return current
}

func stageIndex(code string) int {
	for i, s := range stages {
		if s.Code == code {
			return i
		}
	}
	return 0
}
