package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Config contains authentication configuration
type Config struct {
	JWTSecret     string
	TokenDuration time.Duration
}

// Claims defines JWT claims
type Claims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Service handles authentication operations
type Service struct {
	config       Config
	firebaseAuth *auth.Client
}

// NewService creates a new auth service
func NewService(config Config, app *firebase.App) (*Service, error) {
	ctx := context.Background()
	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Firebase auth client: %w", err)
	}

	return &Service{
		config:       config,
		firebaseAuth: authClient,
	}, nil
}

// GenerateToken creates a JWT token for a user
func (s *Service) GenerateToken(userID, role string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(s.config.TokenDuration)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "nightscout-connector",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return signedToken, nil
}

// VerifyToken validates a JWT token
func (s *Service) VerifyToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// VerifyFirebaseToken verifies a Firebase auth token
func (s *Service) VerifyFirebaseToken(ctx context.Context, idToken string) (*auth.Token, error) {
	token, err := s.firebaseAuth.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, fmt.Errorf("invalid Firebase token: %w", err)
	}
	return token, nil
}

// AuthMiddleware is a Gin middleware for JWT authentication
func (s *Service) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		// Extract the token from the header
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			return
		}
		tokenString := parts[1]

		// Verify the token
		claims, err := s.VerifyToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Add claims to the context for use in handlers
		c.Set("userID", claims.UserID)
		c.Set("userRole", claims.Role)

		c.Next()
	}
}

// FirebaseAuthMiddleware verifies Firebase auth tokens
func (s *Service) FirebaseAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		// Extract the token from the header
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			return
		}
		tokenString := parts[1]

		// Verify the firebase token
		token, err := s.VerifyFirebaseToken(c, tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired Firebase token"})
			return
		}

		// Add user info to the context
		c.Set("userID", token.UID)
		if email, ok := token.Claims["email"]; ok {
			c.Set("userEmail", email)
		}

		c.Next()
	}
}

// GetUserID retrieves the user ID from the Gin context
func GetUserID(c *gin.Context) string {
	userID, exists := c.Get("userID")
	if !exists {
		return ""
	}
	return userID.(string)
}

// HasRole checks if the user has a specific role
func HasRole(c *gin.Context, requiredRole string) bool {
	role, exists := c.Get("userRole")
	if !exists {
		return false
	}
	return role.(string) == requiredRole
}
