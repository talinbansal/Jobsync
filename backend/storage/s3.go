package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Client struct {
	Client     *s3.Client
	BucketName string
}

func NewS3Client(client *s3.Client, bucket string) *S3Client {
	return &S3Client{
		Client:     client,
		BucketName: bucket,
	}
}

func (s *S3Client) UploadFile(
	ctx context.Context,
	file io.Reader,
	key string,
	contentType string,
) (string, error) {
	_, err := s.Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.BucketName),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(contentType),
	})

	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.BucketName, key)
	return url, nil
}
