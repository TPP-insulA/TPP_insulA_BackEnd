FROM node:18-bullseye

WORKDIR /app

# Install build dependencies and OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-dev \
    python3-pip \
    make \
    g++ \
    openssl \
    libssl-dev \
 && rm -rf /var/lib/apt/lists/*

# Set up Python virtual environment
ENV VIRTUAL_ENV=/app/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

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
ENV PYTHON_PATH="$VIRTUAL_ENV/bin/python3"

# Start the server
CMD ["npm", "start"]