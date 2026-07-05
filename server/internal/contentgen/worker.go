package contentgen

import (
	"context"

	"github.com/riverqueue/river"

	"bolo-server/internal/platform/jobs"
)

// Worker consumes lesson.generation.requested from the contentgen queue —
// run by the cmd/contentgen binary, never inside the API process.
type Worker struct {
	river.WorkerDefaults[jobs.LessonGenerationRequestedArgs]
	Svc *Service
}

func (w *Worker) Work(ctx context.Context, job *river.Job[jobs.LessonGenerationRequestedArgs]) error {
	return w.Svc.Run(ctx, job.Args)
}
