.PHONY: run build test vet migrate-up migrate-down migrate-version compose-up compose-down

run:
	go run ./cmd/api

build:
	go build ./...

test:
	go test ./...

vet:
	go vet ./...

migrate-up:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

migrate-version:
	go run ./cmd/migrate version

compose-up:
	docker compose up -d

compose-down:
	docker compose down
