package db

import "backend/internal/storage"

// Connect creates an in-memory storage instance. The DSN is kept for API compatibility.
func Connect(_ string) (*storage.Storage, error) {
	return storage.New(), nil
}
