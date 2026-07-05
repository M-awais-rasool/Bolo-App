// Package objstore wraps S3-compatible object storage (MinIO in dev, any S3
// in production). It holds published content packs and, from M2, audio clips.
package objstore

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Store struct {
	client *minio.Client
	bucket string
}

func New(endpoint, accessKey, secretKey string, useSSL bool, bucket string) (*Store, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, err
	}
	return &Store{client: client, bucket: bucket}, nil
}

// EnsureBucketPublicRead creates the bucket if missing and allows anonymous
// GETs — packs are public, immutable content served CDN-style. Audio will
// live in a separate private bucket; never reuse this one for it.
func (s *Store) EnsureBucketPublicRead(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return err
	}
	if !exists {
		if err := s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{}); err != nil {
			return err
		}
	}
	policy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [{
			"Effect": "Allow",
			"Principal": {"AWS": ["*"]},
			"Action": ["s3:GetObject"],
			"Resource": ["arn:aws:s3:::%s/*"]
		}]
	}`, s.bucket)
	return s.client.SetBucketPolicy(ctx, s.bucket, policy)
}

// EnsureBucket creates the bucket if missing, with no anonymous access —
// the default for anything sensitive, like children's audio.
func (s *Store) EnsureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return err
	}
	if !exists {
		return s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{})
	}
	return nil
}

func (s *Store) PutJSON(ctx context.Context, key string, v any) error {
	body, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return s.Put(ctx, key, body, "application/json")
}

func (s *Store) Put(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key,
		bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: contentType})
	return err
}

// PresignedGet returns a time-limited URL for one private object — the only
// way audio is ever exposed to a client (BACKEND_PLAN.md §12).
func (s *Store) PresignedGet(ctx context.Context, key string, ttl time.Duration) (string, error) {
	u, err := s.client.PresignedGetObject(ctx, s.bucket, key, ttl, nil)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

func (s *Store) Remove(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}
