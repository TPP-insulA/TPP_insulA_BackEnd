FROM node:18-alpine

WORKDIR /app

# Install build dependencies and OpenSSL
RUN apk add --no-cache python3 python3-dev py3-pip make g++ openssl openssl-dev

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install -r requirements.txt

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