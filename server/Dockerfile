# Node.js Express Server Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Set NODE_ENV
ENV NODE_ENV=production

# Start the server
CMD ["node", "index.js"]
