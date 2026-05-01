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

# Expose the API and Web port
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Start command: Apply database schema (create tables if missing) and start the server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && npm start"]
