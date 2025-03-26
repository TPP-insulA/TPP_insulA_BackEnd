// internal/models/nightscout.go
package models

import (
	"time"
)

// GlucoseEntry represents a glucose reading from Nightscout
type GlucoseEntry struct {
	ID         string  `json:"_id"`
	Device     string  `json:"device"`
	DateString string  `json:"dateString"`
	Date       int64   `json:"date"`
	SGV        int     `json:"sgv"` // Sensor Glucose Value in mg/dL
	Delta      float64 `json:"delta"`
	Direction  string  `json:"direction"`
	Type       string  `json:"type"`
	Filtered   float64 `json:"filtered,omitempty"`
	Unfiltered float64 `json:"unfiltered,omitempty"`
	RSSI       int     `json:"rssi,omitempty"`
	Noise      int     `json:"noise,omitempty"`
	SysTime    string  `json:"sysTime,omitempty"`
}

// Convert converts Nightscout data to app format
func (g GlucoseEntry) Convert() map[string]interface{} {
	timestamp := time.Unix(g.Date/1000, 0) // Nightscout stores date in milliseconds

	return map[string]interface{}{
		"value":     g.SGV,
		"timestamp": timestamp,
		"trend":     g.Direction,
		"delta":     g.Delta,
		"source":    "nightscout",
		"raw":       g,
	}
}
