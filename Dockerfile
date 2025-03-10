# Use Node.js as base image
FROM node:18

# Set working directory for backend
WORKDIR /app

# Copy backend package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --force

# Copy backend files
COPY . .

# Set working directory for frontend
WORKDIR /app/evoting-frontend

# Install frontend dependencies
RUN npm install --legacy-peer-deps --force

# Fix OpenSSL issue for Webpack
ENV NODE_OPTIONS="--openssl-legacy-provider"

# Build the frontend
ENV NODE_OPTIONS="--openssl-legacy-provider"
RUN npm run build


# Move frontend build to backend's public folder
RUN mv build ../server/public

# Set working directory back to backend
WORKDIR /app

# Expose backend port
EXPOSE 3000

# Start backend server
CMD ["node", "server/server.js"]
