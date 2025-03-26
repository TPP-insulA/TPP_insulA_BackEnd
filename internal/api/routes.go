// internal/api/routes.go
package api

import (
	"nightscout-connector/internal/auth"
	"nightscout-connector/internal/config"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, cfg *config.Config, authService *auth.Service) {
	// Create API group
	api := r.Group("/api")

	// Public routes that don't need auth
	api.GET("/health", HealthCheck)

	// Protected routes
	protected := api.Group("")
	protected.Use(authService.FirebaseAuthMiddleware())

	// Nightscout routes
	nightscout := protected.Group("/nightscout")
	{
		nightscout.POST("/connect", ConnectNightscout)
		nightscout.GET("/verify", VerifyNightscout)
		nightscout.GET("/entries", GetNightscoutEntries)
		nightscout.DELETE("/disconnect", DisconnectNightscout)
	}
}
