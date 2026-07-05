// Package identity owns parent accounts, auth, child profiles, and category
// assignment — the `identity` bounded context (BACKEND_PLAN.md §1).
package identity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ParentAccount struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email        string
	PasswordHash string
	Phone        *string
	Region       string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (ParentAccount) TableName() string { return "parent_accounts" }

type ChildProfile struct {
	ID                  uuid.UUID `gorm:"type:uuid;primaryKey"`
	ParentID            uuid.UUID `gorm:"type:uuid"`
	Name                string
	DateOfBirth         time.Time `gorm:"type:date"`
	CategoryCode        string
	CategoryConfirmedAt *time.Time
	CreatedAt           time.Time
	DeletedAt           gorm.DeletedAt
}

func (ChildProfile) TableName() string { return "child_profiles" }

type Category struct {
	Code         string `gorm:"primaryKey"`
	Label        string
	MinAgeMonths int
	MaxAgeMonths int
	SortOrder    int
}

func (Category) TableName() string { return "categories" }

type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	ParentID  uuid.UUID `gorm:"type:uuid"`
	TokenHash string
	ExpiresAt time.Time
	RevokedAt *time.Time
	CreatedAt time.Time
}

func (RefreshToken) TableName() string { return "refresh_tokens" }
