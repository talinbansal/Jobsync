package handlers

import "backend/storage"

type AccountHandler struct {
	S3 *storage.S3Client
}

func NewAccountHandler(s3 *storage.S3Client) *AccountHandler {
	return &AccountHandler{S3: s3}
}
