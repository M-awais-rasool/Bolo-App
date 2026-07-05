// The Bolo API — a modular monolith (BACKEND_PLAN.md §1). Modules register
// their routes here and reach each other only through the port adapters at
// the bottom of this file; they never import each other's internals.
package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/rs/zerolog"

	"bolo-server/internal/companion"
	"bolo-server/internal/content"
	"bolo-server/internal/identity"
	"bolo-server/internal/learning"
	"bolo-server/internal/platform/auth"
	"bolo-server/internal/platform/config"
	"bolo-server/internal/platform/database"
	"bolo-server/internal/platform/httpx"
	"bolo-server/internal/platform/jobs"
	"bolo-server/internal/platform/objstore"
	"bolo-server/internal/reporting"
	"bolo-server/internal/speech"
)

func main() {
	log := zerolog.New(os.Stdout).With().Timestamp().Logger()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("config")
	}
	if cfg.IsDevelopment() {
		log = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("database connect")
	}
	// River gets its own pgx pool — it manages listen/notify and job state
	// outside GORM's connection lifecycle.
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("pgx pool")
	}
	defer pool.Close()

	audioStore, err := objstore.New(cfg.S3Endpoint, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3UseSSL, cfg.S3AudioBucket)
	if err != nil {
		log.Fatal().Err(err).Msg("audio store")
	}
	if err := audioStore.EnsureBucket(context.Background()); err != nil {
		log.Fatal().Err(err).Msg("audio bucket")
	}

	var scorer speech.Scorer
	switch cfg.SpeechScorer {
	case "stub":
		scorer = speech.StubScorer{}
		if !cfg.IsDevelopment() {
			log.Warn().Msg("SPEECH_SCORER=stub outside development — scores are not real")
		}
	default:
		log.Fatal().Str("scorer", cfg.SpeechScorer).Msg("unknown SPEECH_SCORER (vendor adapters land after the vendor bake-off)")
	}

	// --- module graph ---

	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	identityService := identity.NewService(identity.NewRepository(db), tokens, cfg.RefreshTokenTTL)
	access := childAccess{identityService}

	companionService := companion.NewService(db, access)

	bus := &riverBus{} // client attached below, before the server accepts traffic
	learningRepo := learning.NewRepository(db)
	learningService := learning.NewService(
		learningRepo, access, content.NewCatalog(db), scorer, audioStore,
		companionService, bus, cfg.AudioRetention,
	)

	reportingService := reporting.NewService(db, access, learningService, companionService, audioStore)

	overlayService := content.NewOverlayService(
		content.NewCatalog(db), content.NewAuthoring(db), access, learningService,
	)

	// --- job queue (BACKEND_PLAN.md §9) ---

	workers := river.NewWorkers()
	river.AddWorker(workers, &reporting.MasteryWorker{Svc: reportingService})
	river.AddWorker(workers, &learning.RetentionSweepWorker{Repo: learningRepo, Audio: audioStore, Log: log})

	riverClient, err := river.NewClient(riverpgxv5.New(pool), &river.Config{
		Queues:  map[string]river.QueueConfig{river.QueueDefault: {MaxWorkers: 10}},
		Workers: workers,
		// The API produces lesson.generation.requested but never works it —
		// that kind is registered only in the contentgen binary.
		SkipUnknownJobCheck: true,
		PeriodicJobs: []*river.PeriodicJob{
			river.NewPeriodicJob(
				river.PeriodicInterval(12*time.Hour),
				func() (river.JobArgs, *river.InsertOpts) { return jobs.RetentionSweepArgs{}, nil },
				&river.PeriodicJobOpts{RunOnStart: true},
			),
		},
	})
	if err != nil {
		log.Fatal().Err(err).Msg("river client")
	}
	bus.client = riverClient
	if err := riverClient.Start(context.Background()); err != nil {
		log.Fatal().Err(err).Msg("river start")
	}

	// --- HTTP ---

	router := gin.New()
	router.Use(gin.Recovery(), httpx.CORS(), httpx.RequestLogger(log))

	router.GET("/healthz", func(c *gin.Context) {
		sqlDB, err := db.DB()
		if err == nil {
			err = sqlDB.PingContext(c.Request.Context())
		}
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	identity.RegisterRoutes(api, identity.NewHandler(identityService, log), tokens)
	learning.RegisterRoutes(api, learning.NewHandler(learningService, log), tokens)
	companion.RegisterRoutes(api, companion.NewHandler(companionService, log), tokens)
	reporting.RegisterRoutes(api, reporting.NewHandler(reportingService, log), tokens)
	content.RegisterRoutes(api, content.NewOverlayHandler(overlayService, log), tokens)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal().Err(err).Msg("server")
		}
	}()
	log.Info().Str("port", cfg.Port).Str("env", cfg.Env).Msg("bolo api listening")

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("http shutdown")
	}
	if err := riverClient.Stop(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("river shutdown")
	}
	log.Info().Msg("shut down cleanly")
}

// --- port adapters (BACKEND_PLAN.md §1: the composition root translates
// between module vocabularies; modules never import each other) ---

// childAccess adapts the identity service to every module that needs
// parent→child ownership proof.
type childAccess struct {
	ids *identity.Service
}

// ChildCategory implements learning.ChildAccess.
func (a childAccess) ChildCategory(ctx context.Context, parentID, childID uuid.UUID) (string, error) {
	child, err := a.ids.ChildForParent(ctx, parentID, childID)
	if err != nil {
		if errors.Is(err, identity.ErrNotFound) {
			return "", learning.ErrChildNotFound
		}
		return "", err
	}
	return child.CategoryCode, nil
}

// OwnsChild implements companion.ChildAccess.
func (a childAccess) OwnsChild(ctx context.Context, parentID, childID uuid.UUID) (bool, error) {
	_, err := a.ids.ChildForParent(ctx, parentID, childID)
	if err != nil {
		if errors.Is(err, identity.ErrNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// Child implements reporting.ChildAccess.
func (a childAccess) Child(ctx context.Context, parentID, childID uuid.UUID) (string, bool, error) {
	child, err := a.ids.ChildForParent(ctx, parentID, childID)
	if err != nil {
		if errors.Is(err, identity.ErrNotFound) {
			return "", false, nil
		}
		return "", false, err
	}
	return child.Name, true, nil
}

// CategoryOf implements content.Children (the overlay's ownership check).
func (a childAccess) CategoryOf(ctx context.Context, parentID, childID uuid.UUID) (string, bool, error) {
	child, err := a.ids.ChildForParent(ctx, parentID, childID)
	if err != nil {
		if errors.Is(err, identity.ErrNotFound) {
			return "", false, nil
		}
		return "", false, err
	}
	return child.CategoryCode, true, nil
}

// riverBus implements learning.Events by inserting River jobs — the
// EventBus adapter from BACKEND_PLAN.md §9. Swapping to Kafka later means
// replacing this struct, nothing else.
type riverBus struct {
	client *river.Client[pgx.Tx]
}

func (b *riverBus) MasteryUpdated(ctx context.Context, childID uuid.UUID) error {
	if b.client == nil {
		return errors.New("event bus not started")
	}
	_, err := b.client.Insert(ctx, jobs.MasteryUpdatedArgs{ChildID: childID}, nil)
	return err
}

func (b *riverBus) LessonGenerationRequested(ctx context.Context, childID uuid.UUID, categoryCode, reason string) error {
	if b.client == nil {
		return errors.New("event bus not started")
	}
	// The args route themselves to the contentgen queue, worked only by the
	// cmd/contentgen binary.
	_, err := b.client.Insert(ctx, jobs.LessonGenerationRequestedArgs{
		ChildID: childID, CategoryCode: categoryCode, Reason: reason,
	}, nil)
	return err
}
