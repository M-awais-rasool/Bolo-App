package identity

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"bolo-server/internal/platform/auth"
)

type Service struct {
	repo       *Repository
	tokens     *auth.TokenManager
	refreshTTL time.Duration
}

func NewService(repo *Repository, tokens *auth.TokenManager, refreshTTL time.Duration) *Service {
	return &Service{repo: repo, tokens: tokens, refreshTTL: refreshTTL}
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

// --- auth ---

func (s *Service) Register(ctx context.Context, email, password, region string) (*ParentAccount, *TokenPair, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}
	parent := &ParentAccount{
		ID:           uuid.New(),
		Email:        strings.ToLower(strings.TrimSpace(email)),
		PasswordHash: string(hash),
		Region:       strings.ToUpper(region),
	}
	if err := s.repo.CreateParent(ctx, parent); err != nil {
		return nil, nil, err
	}
	pair, err := s.issueTokens(ctx, parent.ID)
	if err != nil {
		return nil, nil, err
	}
	return parent, pair, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (*TokenPair, error) {
	parent, err := s.repo.ParentByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		// Same error for unknown email and wrong password — no account enumeration.
		return nil, ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(parent.PasswordHash), []byte(password)) != nil {
		return nil, ErrInvalidCredentials
	}
	return s.issueTokens(ctx, parent.ID)
}

// Refresh rotates the refresh token: the presented token is revoked and a new
// pair is issued, so a stolen token stops working the moment the real client
// refreshes.
func (s *Service) Refresh(ctx context.Context, rawToken string) (*TokenPair, error) {
	stored, err := s.repo.RefreshTokenByHash(ctx, auth.HashRefreshToken(rawToken))
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}
	if stored.RevokedAt != nil || time.Now().After(stored.ExpiresAt) {
		return nil, ErrInvalidRefreshToken
	}
	if err := s.repo.RevokeRefreshToken(ctx, stored.ID); err != nil {
		return nil, err
	}
	return s.issueTokens(ctx, stored.ParentID)
}

func (s *Service) issueTokens(ctx context.Context, parentID uuid.UUID) (*TokenPair, error) {
	access, err := s.tokens.NewAccessToken(parentID)
	if err != nil {
		return nil, err
	}
	raw, hash, err := auth.NewRefreshToken()
	if err != nil {
		return nil, err
	}
	err = s.repo.StoreRefreshToken(ctx, &RefreshToken{
		ID:        uuid.New(),
		ParentID:  parentID,
		TokenHash: hash,
		ExpiresAt: time.Now().Add(s.refreshTTL),
	})
	if err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: access, RefreshToken: raw}, nil
}

// --- children ---

func (s *Service) AddChild(ctx context.Context, parentID uuid.UUID, name string, dob time.Time) (*ChildProfile, error) {
	now := time.Now()
	if !dob.Before(now) {
		return nil, ErrInvalidDateOfBirth
	}
	cats, err := s.repo.Categories(ctx)
	if err != nil {
		return nil, err
	}
	child := &ChildProfile{
		ID:           uuid.New(),
		ParentID:     parentID,
		Name:         strings.TrimSpace(name),
		DateOfBirth:  dob,
		CategoryCode: suggestCategory(cats, ageInMonths(dob, now)),
	}
	if err := s.repo.CreateChild(ctx, child); err != nil {
		return nil, err
	}
	return child, nil
}

func (s *Service) ChildForParent(ctx context.Context, parentID, childID uuid.UUID) (*ChildProfile, error) {
	return s.repo.ChildByIDForParent(ctx, parentID, childID)
}

func (s *Service) ListChildren(ctx context.Context, parentID uuid.UUID) ([]ChildProfile, error) {
	return s.repo.ChildrenByParent(ctx, parentID)
}

// ConfirmCategory records the parent's confirmation (or override) of the
// suggested category — a first-class action, not a hidden setting.
func (s *Service) ConfirmCategory(ctx context.Context, childID uuid.UUID, code string) error {
	if _, err := s.repo.CategoryByCode(ctx, code); err != nil {
		if err == ErrNotFound {
			return ErrUnknownCategory
		}
		return err
	}
	return s.repo.UpdateChildCategory(ctx, childID, code, time.Now())
}
