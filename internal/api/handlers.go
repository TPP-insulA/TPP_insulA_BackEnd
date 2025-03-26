// internal/api/handlers.go
package api

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"nightscout-connector/internal/constants"
	"nightscout-connector/internal/firebase"
	"nightscout-connector/internal/nightscout"

	"github.com/gin-gonic/gin"
)

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": constants.MsgSuccess,
		"time":   time.Now().Format(time.RFC3339),
	})
}

// ConnectNightscout connects a user's Nightscout instance
func ConnectNightscout(c *gin.Context) {
	var request struct {
		UserID        string `json:"userId" binding:"required"`
		NightscoutURL string `json:"nightscoutUrl" binding:"required,url"`
		APIKey        string `json:"apiKey"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create Nightscout client and verify connection
	client := nightscout.NewClient(request.NightscoutURL, request.APIKey)
	if err := client.Verify(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": constants.ErrMsgConnectionFailed, "details": err.Error()})
		return
	}

	// Store connection details in Firebase
	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	fbClient := firebase.NewClient(credPath)
	err := fbClient.SaveNightscoutConnection(request.UserID, request.NightscoutURL, request.APIKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": constants.ErrMsgSaveConnectionFailed, "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": constants.MsgSuccess,
		"url":     request.NightscoutURL,
	})
}

// GetNightscoutEntries fetches entries from Nightscout
func GetNightscoutEntries(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": constants.ErrMsgUserIDRequired})
		return
	}

	// Get count parameter with default value
	count := constants.DefaultEntriesCount
	if countParam := c.Query(constants.ParamCount); countParam != "" {
		if n, err := strconv.Atoi(countParam); err == nil && n > 0 {
			count = n
		}
	}

	// Get connection details from Firebase
	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	fbClient := firebase.NewClient(credPath)
	url, apiKey, err := fbClient.GetNightscoutConnection(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": constants.ErrMsgGetConnectionFailed})
		return
	}

	// Create Nightscout client
	client := nightscout.NewClient(url, apiKey)

	// Parse date parameters
	var dateFrom, dateTo time.Time
	if from := c.Query(constants.ParamFrom); from != "" {
		if t, err := time.Parse(time.RFC3339, from); err == nil {
			dateFrom = t
		}
	}
	if to := c.Query(constants.ParamTo); to != "" {
		if t, err := time.Parse(time.RFC3339, to); err == nil {
			dateTo = t
		}
	}

	// Fetch entries
	entries, err := client.GetEntries(count, dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": constants.ErrMsgFetchEntriesFailed, "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entries": entries,
		"count":   len(entries),
	})
}

// VerifyNightscout verifies the connection to a Nightscout instance
func VerifyNightscout(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	// Get connection details from Firebase
	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	fbClient := firebase.NewClient(credPath)
	url, apiKey, err := fbClient.GetNightscoutConnection(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get connection details"})
		return
	}

	// Create Nightscout client and verify connection
	client := nightscout.NewClient(url, apiKey)
	if err := client.Verify(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to Nightscout", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully connected to Nightscout"})
}

// DisconnectNightscout disconnects a user's Nightscout instance
func DisconnectNightscout(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	// Get connection details from Firebase
	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	fbClient := firebase.NewClient(credPath)
	_, _, err := fbClient.GetNightscoutConnection(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get connection details"})
		return
	}

	// Delete connection details from Firebase
	if err := fbClient.DeleteNightscoutConnection(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect from Nightscout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully disconnected from Nightscout"})
}
