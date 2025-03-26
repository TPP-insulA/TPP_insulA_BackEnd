# InsulA - Nightscout Connector

## Description

This connector allows the InsulA application to integrate with [Nightscout](http://www.nightscout.info/), an open-source continuous glucose monitoring platform. The connector facilitates connection to a Nightscout instance, retrieval of glucose data, and synchronisation with Firebase.

## Prerequisites

- Go 1.21 or higher
- Firebase account with Firestore enabled
- Firebase service credentials (JSON file)

## Configuration

### Environment Variables

You must create a `.env` file in the project root with the following variables:

```env
JWT_SECRET="token-key"
GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
FIREBASE_PROJECT_ID="firebase-project-id"
```

To generate a secure JWT key:

```bash
export JWT_SECRET=$(openssl rand -base64 32)
echo $JWT_SECRET
```

### Firebase Credentials

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click on "Generate new private key"
5. Save the downloaded JSON file in a secure location
6. Configure the path to the file in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## Installation

Clone this repository:

```bash
git clone https://github.com/franciscoduc4/TPP_insulA_BackEnd.git nightscout-connector
cd nightscout-connector
```

Install dependencies:

```bash
go mod download
```

## Execution

### Local Development

```bash
go run nightscout-connector/cmd/server/main.go
```

### With Docker

Build the image:

```bash
docker build -t insulA-nightscout-connector .
```

Run the container:

```bash
docker run -p 8080:8080 \
  -e JWT_SECRET="your-jwt-secret" \
  -e GOOGLE_APPLICATION_CREDENTIALS="/app/config/service-account.json" \
  -e FIREBASE_PROJECT_ID="your-firebase-project" \
  -v /absolute/path/to/service-account.json:/app/config/service-account.json \
  insulA-nightscout-connector
```

## API Endpoints

### Check Service Status

- **GET** `/api/health`
- **Response**: Service status and timestamp

### Connect to Nightscout

- **POST** `/api/nightscout/connect`
- **Auth**: Required
- **Body**:

  ```json
  {
    "userId": "user-id",
    "nightscoutUrl": "https://your-nightscout-site.com",
    "apiKey": "optional-api-token"
  }
  ```

- **Response**: Confirmation of successful connection

### Verify Nightscout Connection

- **GET** `/api/nightscout/verify?userId=user-id`
- **Auth**: Required
- **Response**: Connection status

### Get Glucose Data

- **GET** `/api/nightscout/entries?userId=user-id&count=24&from=2023-01-01T00:00:00Z&to=2023-01-02T00:00:00Z`
- **Auth**: Required
- **Parameters**:
  - `userId`: User ID (required)
  - `count`: Number of records (default: 24)
  - `from`: Start date (ISO format)
  - `to`: End date (ISO format)
- **Response**: List of glucose records

### Disconnect from Nightscout

- **DELETE** `/api/nightscout/disconnect?userId=user-id`
- **Auth**: Required
- **Response**: Confirmation of successful disconnection

## Project Structure

```sh
.
├── Dockerfile
├── README.md
├── go.mod
├── go.sum
├── internal
│   ├── api         # API controllers and routes
│   ├── auth        # Authentication logic
│   ├── config      # Application configuration
│   ├── constants   # Constants used in the project
│   ├── firebase    # Firebase client and integration
│   ├── models      # Data models
│   └── nightscout  # Client for Nightscout API
└── nightscout-connector
    └── cmd
        └── server  # Application entry point
```

## Development

### Adding New Features

1. Create new controllers in `internal/api/handlers.go`
2. Add new routes in `internal/api/routes.go`
3. Update constants in `internal/constants/constants.go`, if necessary

### Tests

To run tests:

```bash
go test ./...
```

## Licence

This project is licensed under the [MIT Licence](LICENSE).
