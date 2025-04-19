FROM node:18-alpine

WORKDIR /app

# Install build dependencies and OpenSSL
RUN apk add --no-cache python3 make g++ openssl openssl-dev

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Clean up development dependencies
RUN npm prune --production

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]