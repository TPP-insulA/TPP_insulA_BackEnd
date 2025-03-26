FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Environments
ENV JWT_SECRET=${JWT_SECRET}
ENV GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS}
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o nightscout-api ./cmd/server

# Use a small image for the final container
FROM alpine:3.18

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/nightscout-api .

# Run the binary
CMD ["./nightscout-api"]