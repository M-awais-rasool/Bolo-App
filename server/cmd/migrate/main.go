// Migration runner: `go run ./cmd/migrate up|down|version`.
// Uses the SQL files in /migrations so schema changes are reviewable in PRs.
package main

import (
	"errors"
	"fmt"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

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
		err = m.Up()
	case "down":
		err = m.Steps(-1)
	case "version":
		version, dirty, verr := m.Version()
		if verr != nil && !errors.Is(verr, migrate.ErrNilVersion) {
			fatal(verr)
		}
		fmt.Printf("version=%d dirty=%v\n", version, dirty)
		return
	default:
		fatal(fmt.Errorf("unknown command %q (want up, down, or version)", cmd))
	}

	if errors.Is(err, migrate.ErrNoChange) {
		fmt.Println("no change")
		return
	}
	if err != nil {
		fatal(err)
	}
	fmt.Printf("migrate %s: ok\n", cmd)
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "migrate:", err)
	os.Exit(1)
}
