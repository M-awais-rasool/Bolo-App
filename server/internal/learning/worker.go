package learning

import (
	"context"
	"time"

	"github.com/riverqueue/river"
	"github.com/rs/zerolog"

	"bolo-server/internal/platform/jobs"
)

// AudioRemover deletes one object from the private audio bucket.
type AudioRemover interface {
	Remove(ctx context.Context, key string) error
}

// RetentionSweepWorker enforces the audio retention policy: deletion is a
// running job, not a promise (BACKEND_PLAN.md §12). Scores survive; the
// recording itself is removed once retain_until passes.
type RetentionSweepWorker struct {
	river.WorkerDefaults[jobs.RetentionSweepArgs]
	Repo  *Repository
	Audio AudioRemover
	Log   zerolog.Logger
}

const sweepBatchSize = 200

func (w *RetentionSweepWorker) Work(ctx context.Context, _ *river.Job[jobs.RetentionSweepArgs]) error {
	deleted := 0
	for {
		expired, err := w.Repo.ExpiredAudio(ctx, time.Now(), sweepBatchSize)
		if err != nil {
			return err
		}
		if len(expired) == 0 {
			break
		}
		for _, attempt := range expired {
			if attempt.AudioObjectKey == nil {
				continue
			}
			if err := w.Audio.Remove(ctx, *attempt.AudioObjectKey); err != nil {
				return err // River retries the job; the sweep is idempotent
			}
			if err := w.Repo.ClearAudioRef(ctx, attempt.ID); err != nil {
				return err
			}
			deleted++
		}
	}
	if deleted > 0 {
		w.Log.Info().Int("deleted", deleted).Msg("audio retention sweep")
	}
	return nil
}
