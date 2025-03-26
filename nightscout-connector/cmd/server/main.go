// cmd/server/main.go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"nightscout-connector/internal/api"

	"nightscout-connector/internal/auth"

	"nightscout-connector/internal/config"

	firebase "firebase.google.com/go/v4"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/option"
)

func main() {
	// Carga de la configuración
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Levantar la aplicación de Firebase
	ctx := context.Background()
	opt := option.WithCredentialsFile(cfg.CredentialsPath)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase app: %v", err)
	}

	// Levantar el servicio de autenticación
	authCfg := auth.Config{
		JWTSecret:     os.Getenv("JWT_SECRET"),
		TokenDuration: 24 * time.Hour,
	}
	authService, err := auth.NewService(authCfg, app)
	if err != nil {
		log.Fatalf("Failed to initialize auth service: %v", err)
	}

	// Initialize router
	router := gin.Default()

	// Setup de las rutas de la API con autenticación
	api.SetupRoutes(router, cfg, authService)

	// Obtención del puerto del entorno, o usar el puerto 8080 por defecto
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Levantar el servidor
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
