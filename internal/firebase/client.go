// internal/firebase/client.go
package firebase

import (
	"context"
	"fmt"

	"nightscout-connector/internal/constants"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

type Client struct {
	app *firebase.App
	ctx context.Context
}

func NewClient(credentialsPath string) *Client {
	ctx := context.Background()

	// Initialize Firebase app with credentials
	var app *firebase.App
	var err error

	if credentialsPath != "" {
		opt := option.WithCredentialsFile(credentialsPath)
		app, err = firebase.NewApp(ctx, nil, opt)
	} else {
		app, err = firebase.NewApp(ctx, nil)
	}

	if err != nil {
		// TODO: handle this error appropriately
		panic(fmt.Sprintf("Failed to initialize Firebase app: %v", err))
	}

	return &Client{
		app: app,
		ctx: ctx,
	}
}

// SaveNightscoutConnection stores Nightscout connection details for a user
func (c *Client) SaveNightscoutConnection(userID, url, apiKey string) error {
	client, err := c.app.Firestore(c.ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	data := map[string]interface{}{
		constants.FieldNightscoutURL:    url,
		constants.FieldNightscoutAPIKey: apiKey,
		constants.FieldConnected:        true,
		constants.FieldLastUpdated:      firestore.ServerTimestamp,
	}

	_, err = client.Collection(constants.UserConnectionsCollection).Doc(userID).Set(c.ctx, data, firestore.MergeAll)
	return err
}

// GetNightscoutConnection retrieves a user's Nightscout connection details
func (c *Client) GetNightscoutConnection(userID string) (string, string, error) {
	client, err := c.app.Firestore(c.ctx)
	if err != nil {
		return "", "", err
	}
	defer client.Close()

	doc, err := client.Collection(constants.UserConnectionsCollection).Doc(userID).Get(c.ctx)
	if err != nil {
		return "", "", err
	}

	data := doc.Data()
	url, _ := data[constants.FieldNightscoutURL].(string)
	apiKey, _ := data[constants.FieldNightscoutAPIKey].(string)

	return url, apiKey, nil
}

// DeleteNightscoutConnection removes a user's Nightscout connection
func (c *Client) DeleteNightscoutConnection(userID string) error {
	client, err := c.app.Firestore(c.ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	_, err = client.Collection(constants.UserConnectionsCollection).Doc(userID).Delete(c.ctx)
	return err
}
