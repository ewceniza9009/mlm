# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (adjust if needed, default is usually 3000 or 5000)
# Looking at server.ts might reveal the port, but standard is fine.
EXPOSE 5000

# Start command
CMD ["npm", "start"]
