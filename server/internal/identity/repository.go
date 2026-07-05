package identity

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

// Repository is the only code that touches identity tables. Other modules go
// through the Service — never through these tables directly (BACKEND_PLAN.md §1).
type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

const uniqueViolation = "23505"

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == uniqueViolation
}

func notFoundMapped(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

// --- parents ---

func (r *Repository) CreateParent(ctx context.Context, p *ParentAccount) error {
	err := r.db.WithContext(ctx).Create(p).Error
	if isUniqueViolation(err) {
		return ErrEmailTaken
	}
	return err
}

func (r *Repository) ParentByEmail(ctx context.Context, email string) (*ParentAccount, error) {
	var p ParentAccount
	if err := r.db.WithContext(ctx).First(&p, "email = ?", email).Error; err != nil {
		return nil, notFoundMapped(err)
	}
	return &p, nil
}

// --- refresh tokens ---

func (r *Repository) StoreRefreshToken(ctx context.Context, t *RefreshToken) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *Repository) RefreshTokenByHash(ctx context.Context, hash string) (*RefreshToken, error) {
	var t RefreshToken
	if err := r.db.WithContext(ctx).First(&t, "token_hash = ?", hash).Error; err != nil {
		return nil, notFoundMapped(err)
	}
	return &t, nil
}

func (r *Repository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&RefreshToken{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Update("revoked_at", time.Now()).Error
}

// --- categories ---

func (r *Repository) Categories(ctx context.Context) ([]Category, error) {
	var cats []Category
	err := r.db.WithContext(ctx).Order("sort_order").Find(&cats).Error
	return cats, err
}

func (r *Repository) CategoryByCode(ctx context.Context, code string) (*Category, error) {
	var c Category
	if err := r.db.WithContext(ctx).First(&c, "code = ?", code).Error; err != nil {
		return nil, notFoundMapped(err)
	}
	return &c, nil
}

// --- children ---

func (r *Repository) CreateChild(ctx context.Context, c *ChildProfile) error {
	return r.db.WithContext(ctx).Create(c).Error
}

// ChildByIDForParent scopes the lookup to the owning parent — the query
// itself enforces ownership, so there is no code path that can forget the
// check (BACKEND_PLAN.md §12).
func (r *Repository) ChildByIDForParent(ctx context.Context, parentID, childID uuid.UUID) (*ChildProfile, error) {
	var c ChildProfile
	err := r.db.WithContext(ctx).First(&c, "id = ? AND parent_id = ?", childID, parentID).Error
	if err != nil {
		return nil, notFoundMapped(err)
	}
	return &c, nil
}

func (r *Repository) ChildrenByParent(ctx context.Context, parentID uuid.UUID) ([]ChildProfile, error) {
	var children []ChildProfile
	err := r.db.WithContext(ctx).
		Where("parent_id = ?", parentID).
		Order("created_at").
		Find(&children).Error
	return children, err
}

func (r *Repository) UpdateChildCategory(ctx context.Context, childID uuid.UUID, code string, confirmedAt time.Time) error {
	return r.db.WithContext(ctx).
		Model(&ChildProfile{}).
		Where("id = ?", childID).
		Updates(map[string]any{
			"category_code":         code,
			"category_confirmed_at": confirmedAt,
		}).Error
}
