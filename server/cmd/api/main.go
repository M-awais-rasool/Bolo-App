// The Bolo API — a modular monolith (BACKEND_PLAN.md §1). Modules register
// their routes here; they never import each other's internals.
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
	"github.com/rs/zerolog"

	"bolo-server/internal/content"
	"bolo-server/internal/identity"
	"bolo-server/internal/learning"
	"bolo-server/internal/platform/auth"
	"bolo-server/internal/platform/config"
	"bolo-server/internal/platform/database"
	"bolo-server/internal/platform/httpx"
	"bolo-server/internal/platform/objstore"
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

	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	identityService := identity.NewService(identity.NewRepository(db), tokens, cfg.RefreshTokenTTL)
	identityHandler := identity.NewHandler(identityService, log)

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

	learningHandler := learning.NewHandler(
		learning.NewService(
			learning.NewRepository(db),
			childAccess{identityService},
			content.NewCatalog(db),
			scorer,
			audioStore,
			cfg.AudioRetention,
		),
		log,
	)

	router := gin.New()
	router.Use(gin.Recovery(), httpx.RequestLogger(log))

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
	identity.RegisterRoutes(api, identityHandler, tokens)
	learning.RegisterRoutes(api, learningHandler, tokens)

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
		log.Error().Err(err).Msg("shutdown")
	}
	log.Info().Msg("shut down cleanly")
}

// childAccess adapts the identity module's public service to the learning
// module's ChildAccess port — the composition root owns the translation
// between module vocabularies (BACKEND_PLAN.md §1).
type childAccess struct {
	ids *identity.Service
}

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
