// Package jobs defines the async job contracts (BACKEND_PLAN.md §9). The
// names are the event names from the plan; the transport today is River
// (Postgres-backed), and swapping to Kafka later means new adapters, not new
// contracts.
package jobs

import (
	"github.com/google/uuid"
	"github.com/riverqueue/river"
)

// QueueContentgen is worked only by the contentgen binary — generation is
// bursty and LLM-latency-bound, so it scales separately from the API
// (BACKEND_PLAN.md §1).
const QueueContentgen = "contentgen"

// MasteryUpdatedArgs — produced by learning when a session completes;
// consumed by reporting to refresh the child's progress snapshot.
type MasteryUpdatedArgs struct {
	ChildID uuid.UUID `json:"child_id"`
}

func (MasteryUpdatedArgs) Kind() string { return "mastery.updated" }

// RetentionSweepArgs — periodic; deletes attempt audio past retain_until
// from object storage and nulls the reference (BACKEND_PLAN.md §12).
type RetentionSweepArgs struct{}

func (RetentionSweepArgs) Kind() string { return "audio.retention.sweep" }

// LessonGenerationRequestedArgs — produced when a child exhausts their
// curriculum (or, later, by remedial and buffer triggers); consumed by the
// contentgen worker (BACKEND_PLAN.md §7).
type LessonGenerationRequestedArgs struct {
	ChildID      uuid.UUID `json:"child_id"`
	CategoryCode string    `json:"category_code"`
	Reason       string    `json:"reason"` // curriculum_exhausted | remedial | buffer
}

func (LessonGenerationRequestedArgs) Kind() string { return "lesson.generation.requested" }

func (LessonGenerationRequestedArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: QueueContentgen}
}
