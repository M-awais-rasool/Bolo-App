// The contentgen worker — the one module deployed separately from day one
// (BACKEND_PLAN.md §1): generation is bursty and LLM-latency-bound, so it
// scales independently of the API. It works only the contentgen queue.
package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/rs/zerolog"

	"bolo-server/internal/companion"
	"bolo-server/internal/content"
	"bolo-server/internal/contentgen"
	"bolo-server/internal/learning"
	"bolo-server/internal/platform/config"
	"bolo-server/internal/platform/database"
	"bolo-server/internal/platform/jobs"
)

func main() {
	log := zerolog.New(os.Stdout).With().Timestamp().Str("service", "contentgen").Logger()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("config")
	}
	if cfg.IsDevelopment() {
		log = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})
	}

	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("database connect")
	}
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("pgx pool")
	}
	defer pool.Close()

	var generator contentgen.Generator
	switch cfg.ContentgenProvider {
	case "stub":
		generator = contentgen.StubGenerator{}
		if !cfg.IsDevelopment() {
			log.Warn().Msg("CONTENTGEN_PROVIDER=stub outside development — lessons come from templates, not a model")
		}
	case "anthropic":
		if cfg.AnthropicAPIKey == "" {
			log.Fatal().Msg("CONTENTGEN_PROVIDER=anthropic requires ANTHROPIC_API_KEY")
		}
		generator = contentgen.NewClaudeGenerator(cfg.AnthropicAPIKey, cfg.ContentgenModel)
	default:
		log.Fatal().Str("provider", cfg.ContentgenProvider).Msg("unknown CONTENTGEN_PROVIDER (want stub or anthropic)")
	}

	// contentgen reads other modules through narrow adapters — it never
	// needs their request-path services, only these two read ports.
	service := contentgen.NewService(
		db,
		content.NewAuthoring(db),
		learningReads{learning.NewRepository(db)},
		companion.NewService(db, denyAllChildren{}),
		generator,
		log,
	)

	workers := river.NewWorkers()
	river.AddWorker(workers, &contentgen.Worker{Svc: service})

	client, err := river.NewClient(riverpgxv5.New(pool), &river.Config{
		Queues:  map[string]river.QueueConfig{jobs.QueueContentgen: {MaxWorkers: 2}},
		Workers: workers,
	})
	if err != nil {
		log.Fatal().Err(err).Msg("river client")
	}
	if err := client.Start(context.Background()); err != nil {
		log.Fatal().Err(err).Msg("river start")
	}
	log.Info().Str("provider", cfg.ContentgenProvider).Msg("contentgen worker running")

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := client.Stop(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("river shutdown")
	}
	log.Info().Msg("shut down cleanly")
}

// learningReads adapts the learning repository to contentgen.LearningReads.
type learningReads struct {
	repo *learning.Repository
}

func (l learningReads) MasteredWordIDs(ctx context.Context, childID uuid.UUID) ([]string, error) {
	return l.repo.MasteredWordIDs(ctx, childID)
}

func (l learningReads) WeakPhonemeCodes(ctx context.Context, childID uuid.UUID, limit int) ([]string, error) {
	rows, err := l.repo.WeakPhonemesTop(ctx, childID, limit)
	if err != nil {
		return nil, err
	}
	codes := make([]string, 0, len(rows))
	for _, row := range rows {
		codes = append(codes, row.Phoneme)
	}
	return codes, nil
}

// denyAllChildren satisfies companion.ChildAccess for a worker that only uses
// the parent-free reads; any ownership check in this process is a bug.
type denyAllChildren struct{}

func (denyAllChildren) OwnsChild(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return false, nil
}
