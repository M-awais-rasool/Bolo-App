package identity

import "errors"

var (
	ErrNotFound            = errors.New("not found")
	ErrEmailTaken          = errors.New("email already registered")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
	ErrUnknownCategory     = errors.New("unknown category code")
	ErrInvalidDateOfBirth  = errors.New("date_of_birth must be in the past")
)
