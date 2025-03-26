// internal/nightscout/client.go
package nightscout

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"nightscout-connector/internal/constants"
	"nightscout-connector/internal/models"
)

type Client struct {
	BaseURL string
	APIKey  string
	client  *http.Client
}

func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		BaseURL: baseURL,
		APIKey:  apiKey,
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

// Verify checks if the Nightscout connection is valid
func (c *Client) Verify() error {
	resp, err := c.makeRequest("GET", constants.NightscoutAPIStatusEndpoint, nil)
	if err != nil {
		return fmt.Errorf("failed to verify Nightscout connection: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("invalid Nightscout credentials or URL: status %d", resp.StatusCode)
	}

	return nil
}

// GetEntries fetches glucose entries from Nightscout
func (c *Client) GetEntries(count int, dateFrom, dateTo time.Time) ([]models.GlucoseEntry, error) {
	// Build query parameters
	endpoint := fmt.Sprintf("%s?count=%d", constants.NightscoutAPIEntriesEndpoint, count)
	if !dateFrom.IsZero() {
		endpoint += fmt.Sprintf("&find[dateString][$gte]=%s", dateFrom.Format(time.RFC3339))
	}
	if !dateTo.IsZero() {
		endpoint += fmt.Sprintf("&find[dateString][$lte]=%s", dateTo.Format(time.RFC3339))
	}

	resp, err := c.makeRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch entries: %w", err)
	}
	defer resp.Body.Close()

	var entries []models.GlucoseEntry
	if err := json.NewDecoder(resp.Body).Decode(&entries); err != nil {
		return nil, fmt.Errorf("failed to parse entries: %w", err)
	}

	return entries, nil
}

// makeRequest is a helper function to make HTTP requests
func (c *Client) makeRequest(method, endpoint string, body interface{}) (*http.Response, error) {
	url := c.BaseURL + endpoint

	// Add API token if provided
	if c.APIKey != "" {
		if strings.Contains(endpoint, "?") {
			url += "&token=" + c.APIKey
		} else {
			url += "?token=" + c.APIKey
		}
	}

	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}

	return c.client.Do(req)
}
