// The content-review queue CLI (BACKEND_PLAN.md §7.2 step 6): "even a simple
// internal admin screen is enough at v1 — this is a queue, not a feature."
//
//	go run ./cmd/lessons pending          list lessons awaiting review
//	go run ./cmd/lessons show <id>        print one lesson's content JSON
//	go run ./cmd/lessons approve <id>     pending_review → active
//	go run ./cmd/lessons reject <id>      pending_review → retired
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/google/uuid"

	"bolo-server/internal/content"
	"bolo-server/internal/platform/config"
	"bolo-server/internal/platform/database"
)

func main() {
	if len(os.Args) < 2 {
		fatal(fmt.Errorf("usage: lessons pending | show <id> | approve <id> | reject <id>"))
	}

	cfg, err := config.Load()
	if err != nil {
		fatal(err)
	}
	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		fatal(err)
	}
	authoring := content.NewAuthoring(db)
	ctx := context.Background()

	switch os.Args[1] {
	case "pending":
		rows, err := authoring.PendingReview(ctx)
		if err != nil {
			fatal(err)
		}
		if len(rows) == 0 {
			fmt.Println("review queue is empty")
			return
		}
		for _, rec := range rows {
			child := "shared"
			if rec.ChildID != nil {
				child = "child " + rec.ChildID.String()
			}
			fmt.Printf("%s  %-12s %-16s %s\n", rec.ID, rec.CategoryCode, rec.ClientID, child)
		}
	case "show":
		rec := mustLesson(ctx, authoring)
		var pretty json.RawMessage = json.RawMessage(rec.Content)
		out, _ := json.MarshalIndent(pretty, "", "  ")
		fmt.Printf("id=%s status=%s category=%s order=%d\n%s\n", rec.ID, rec.Status, rec.CategoryCode, rec.OrderIndex, out)
	case "approve":
		rec := mustLesson(ctx, authoring)
		if err := authoring.SetStatus(ctx, rec.ID, "active"); err != nil {
			fatal(err)
		}
		fmt.Printf("approved %s (%s) — now active\n", rec.ID, rec.ClientID)
	case "reject":
		rec := mustLesson(ctx, authoring)
		if err := authoring.SetStatus(ctx, rec.ID, "retired"); err != nil {
			fatal(err)
		}
		fmt.Printf("rejected %s (%s) — retired\n", rec.ID, rec.ClientID)
	default:
		fatal(fmt.Errorf("unknown command %q", os.Args[1]))
	}
}

func mustLesson(ctx context.Context, authoring *content.Authoring) *content.LessonRecord {
	if len(os.Args) < 3 {
		fatal(fmt.Errorf("usage: lessons %s <lesson-uuid>", os.Args[1]))
	}
	id, err := uuid.Parse(os.Args[2])
	if err != nil {
		fatal(fmt.Errorf("invalid lesson id: %w", err))
	}
	rec, err := authoring.LessonRecordByID(ctx, id)
	if err != nil {
		fatal(err)
	}
	return rec
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "lessons:", err)
	os.Exit(1)
}
