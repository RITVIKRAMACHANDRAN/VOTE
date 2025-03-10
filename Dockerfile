# Use Node.js 18 (or change to 20 if needed)
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json before installing dependencies
COPY package*.json ./

# Clean install dependencies
RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps

# Copy the entire project after installing dependencies
COPY . .

# Set working directory for frontend
WORKDIR /app/evoting-frontend

# Ensure correct Node.js options
ENV NODE_OPTIONS="--openssl-legacy-provider"

# Install frontend dependencies separately to avoid conflicts
RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps

# Build frontend
RUN npm run build

# Move frontend build to backend's public folder
WORKDIR /app
RUN mv evoting-frontend/build server

# Expose the backend port
EXPOSE 5000

# Start the backend server
CMD ["node", "server/server.js"]
