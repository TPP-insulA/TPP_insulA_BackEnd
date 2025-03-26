// internal/config/config.go
package config

import (
	"os"
)

type Config struct {
	Port            string
	FirebaseProject string
	CredentialsPath string
}

func Load() (*Config, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fbProject := os.Getenv("FIREBASE_PROJECT_ID")
	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")

	return &Config{
		Port:            port,
		FirebaseProject: fbProject,
		CredentialsPath: credPath,
	}, nil
}
