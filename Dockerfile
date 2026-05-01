FROM node:20-alpine

# Install Python and build tools for SQLite and native dependencies
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package configuration
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the React frontend using Vite
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate

# Expose port (Render will override with its own PORT env var)
EXPOSE 10000

# Set environment variables for production
ENV NODE_ENV=production

# Start command: Apply database schema and start the server
# Use || true so server starts even if db push has issues (e.g. already in sync)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate || true && npm start"]
