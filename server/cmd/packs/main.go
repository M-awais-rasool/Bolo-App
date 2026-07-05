// Pack publishing pipeline (BACKEND_PLAN.md §4.2, M1):
//
//	go run ./cmd/packs publish <category_code> <pack.json>
//
// Validates the pack against the client contract, records it in Postgres,
// and uploads the immutable serving objects to the packs bucket.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"bolo-server/internal/content"
	"bolo-server/internal/platform/config"
	"bolo-server/internal/platform/database"
	"bolo-server/internal/platform/objstore"
)

func main() {
	if len(os.Args) != 4 || os.Args[1] != "publish" {
		fatal(fmt.Errorf("usage: packs publish <category_code> <pack.json>"))
	}
	categoryCode, packPath := os.Args[2], os.Args[3]

	cfg, err := config.Load()
	if err != nil {
		fatal(err)
	}

	raw, err := os.ReadFile(packPath)
	if err != nil {
		fatal(err)
	}
	var pack content.ContentPack
	if err := json.Unmarshal(raw, &pack); err != nil {
		fatal(fmt.Errorf("parse %s: %w", packPath, err))
	}

	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		fatal(err)
	}
	store, err := objstore.New(cfg.S3Endpoint, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3UseSSL, cfg.S3PacksBucket)
	if err != nil {
		fatal(err)
	}

	latest, err := content.NewPublisher(db, store).Publish(context.Background(), categoryCode, &pack)
	if err != nil {
		fatal(err)
	}

	scheme := "http"
	if cfg.S3UseSSL {
		scheme = "https"
	}
	fmt.Printf("published %s revision %d (%d lessons)\n", latest.CategoryCode, latest.Revision, len(pack.Lessons))
	fmt.Printf("  pack:   %s://%s/%s/%s\n", scheme, cfg.S3Endpoint, cfg.S3PacksBucket, latest.URL)
	fmt.Printf("  latest: %s://%s/%s/packs/%s/latest.json\n", scheme, cfg.S3Endpoint, cfg.S3PacksBucket, latest.CategoryCode)
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "packs:", err)
	os.Exit(1)
}
