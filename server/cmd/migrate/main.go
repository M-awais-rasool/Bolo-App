// Migration runner: `go run ./cmd/migrate up|down|version`.
// Uses the SQL files in /migrations so schema changes are reviewable in PRs,
// then applies River's queue schema (managed by River's own migrator).
package main

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/riverqueue/river/rivermigrate"

	"bolo-server/internal/platform/config"
)

func main() {
	cmd := "up"
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}

	cfg, err := config.Load()
	if err != nil {
		fatal(err)
	}

	m, err := migrate.New("file://migrations", cfg.DatabaseURL)
	if err != nil {
		fatal(err)
	}
	defer m.Close()

	switch cmd {
	case "up":
		if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			fatal(err)
		}
		if err := migrateRiver(cfg.DatabaseURL); err != nil {
			fatal(err)
		}
		fmt.Println("migrate up: ok (sql + river)")
	case "down":
		if err := m.Steps(-1); err != nil {
			fatal(err)
		}
		fmt.Println("migrate down: ok")
	case "version":
		version, dirty, verr := m.Version()
		if verr != nil && !errors.Is(verr, migrate.ErrNilVersion) {
			fatal(verr)
		}
		fmt.Printf("version=%d dirty=%v\n", version, dirty)
	default:
		fatal(fmt.Errorf("unknown command %q (want up, down, or version)", cmd))
	}
}

func migrateRiver(databaseURL string) error {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	migrator, err := rivermigrate.New(riverpgxv5.New(pool), nil)
	if err != nil {
		return err
	}
	_, err = migrator.Migrate(ctx, rivermigrate.DirectionUp, nil)
	return err
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "migrate:", err)
	os.Exit(1)
}
