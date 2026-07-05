// Package auth issues and verifies parent credentials' tokens.
//
// Access tokens are short-lived JWTs (HS256). Refresh tokens are opaque
// random values stored server-side as a SHA-256 hash so a database leak
// never leaks usable tokens; they rotate on every use.
//
// Only parents ever hold tokens — there is no child identity in the auth
// layer by design (BACKEND_PLAN.md §12).
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var ErrInvalidToken = errors.New("invalid token")

type TokenManager struct {
	secret    []byte
	accessTTL time.Duration
}

func NewTokenManager(secret string, accessTTL time.Duration) *TokenManager {
	return &TokenManager{secret: []byte(secret), accessTTL: accessTTL}
}

func (m *TokenManager) NewAccessToken(parentID uuid.UUID) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   parentID.String(),
		Issuer:    "bolo-api",
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(m.accessTTL)),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
}

func (m *TokenManager) ParseAccessToken(raw string) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(raw, &jwt.RegisteredClaims{},
		func(t *jwt.Token) (any, error) { return m.secret, nil },
		jwt.WithValidMethods([]string{"HS256"}),
	)
	if err != nil || !token.Valid {
		return uuid.Nil, ErrInvalidToken
	}
	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return uuid.Nil, ErrInvalidToken
	}
	id, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, ErrInvalidToken
	}
	return id, nil
}

// NewRefreshToken returns the raw value (sent to the client once) and its
// hash (the only form ever persisted).
func NewRefreshToken() (raw, hash string, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return "", "", err
	}
	raw = hex.EncodeToString(b)
	return raw, HashRefreshToken(raw), nil
}

func HashRefreshToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
