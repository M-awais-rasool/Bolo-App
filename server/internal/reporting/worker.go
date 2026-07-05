package reporting

import (
	"context"

	"github.com/riverqueue/river"

	"bolo-server/internal/platform/jobs"
)

// MasteryWorker consumes mastery.updated and refreshes the child's progress
// snapshot (BACKEND_PLAN.md §9).
type MasteryWorker struct {
	river.WorkerDefaults[jobs.MasteryUpdatedArgs]
	Svc *Service
}

func (w *MasteryWorker) Work(ctx context.Context, job *river.Job[jobs.MasteryUpdatedArgs]) error {
	return w.Svc.RefreshSnapshot(ctx, job.Args.ChildID)
}
