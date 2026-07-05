// Package config loads runtime configuration from the environment
// (optionally seeded by a local .env file in development).
package config

import (
	"errors"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Env             string
	Port            string
	DatabaseURL     string
	JWTSecret       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration

	// S3-compatible object storage (MinIO in dev — see docker-compose.yml).
	// Packs are public; audio is private and never shares a bucket with them.
	S3Endpoint    string
	S3AccessKey   string
	S3SecretKey   string
	S3UseSSL      bool
	S3PacksBucket string
	S3AudioBucket string

	// How long attempt audio is kept before the retention sweep deletes it
	// (BACKEND_PLAN.md §12).
	AudioRetention time.Duration

	// Which pronunciation scorer backs the speech module ("stub" until a
	// vendor is chosen).
	SpeechScorer string
}

func (c *Config) IsDevelopment() bool { return c.Env == "development" }

func Load() (*Config, error) {
	v := viper.New()

	v.SetDefault("ENV", "development")
	v.SetDefault("PORT", "8080")
	v.SetDefault("DATABASE_URL", "postgres://bolo:bolo@localhost:5432/bolo?sslmode=disable")
	v.SetDefault("ACCESS_TOKEN_TTL", "15m")
	v.SetDefault("REFRESH_TOKEN_TTL", "720h") // 30 days
	v.SetDefault("S3_ENDPOINT", "localhost:9000")
	v.SetDefault("S3_ACCESS_KEY", "bolo")
	v.SetDefault("S3_SECRET_KEY", "bolo-secret")
	v.SetDefault("S3_USE_SSL", false)
	v.SetDefault("S3_PACKS_BUCKET", "bolo-packs")
	v.SetDefault("S3_AUDIO_BUCKET", "bolo-audio")
	v.SetDefault("AUDIO_RETENTION", "2160h") // 90 days
	v.SetDefault("SPEECH_SCORER", "stub")

	// .env is a development convenience; real environments set env vars.
	v.SetConfigFile(".env")
	v.SetConfigType("env")
	_ = v.ReadInConfig()
	v.AutomaticEnv()

	cfg := &Config{
		Env:             v.GetString("ENV"),
		Port:            v.GetString("PORT"),
		DatabaseURL:     v.GetString("DATABASE_URL"),
		JWTSecret:       v.GetString("JWT_SECRET"),
		AccessTokenTTL:  v.GetDuration("ACCESS_TOKEN_TTL"),
		RefreshTokenTTL: v.GetDuration("REFRESH_TOKEN_TTL"),
		S3Endpoint:      v.GetString("S3_ENDPOINT"),
		S3AccessKey:     v.GetString("S3_ACCESS_KEY"),
		S3SecretKey:     v.GetString("S3_SECRET_KEY"),
		S3UseSSL:        v.GetBool("S3_USE_SSL"),
		S3PacksBucket:   v.GetString("S3_PACKS_BUCKET"),
		S3AudioBucket:   v.GetString("S3_AUDIO_BUCKET"),
		AudioRetention:  v.GetDuration("AUDIO_RETENTION"),
		SpeechScorer:    v.GetString("SPEECH_SCORER"),
	}

	if cfg.JWTSecret == "" {
		if !cfg.IsDevelopment() {
			return nil, errors.New("JWT_SECRET is required outside development")
		}
		cfg.JWTSecret = "dev-only-insecure-secret"
	}
	return cfg, nil
}
