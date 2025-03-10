# Use a stable Node.js version
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first (better cache optimization)
COPY package*.json ./

# Install dependencies with legacy peer dependencies handling
RUN npm install --legacy-peer-deps

# Copy the entire project after installing dependencies
COPY . .

# Set working directory for frontend
WORKDIR /app/evoting-frontend

# Ensure correct Node.js options
ENV NODE_OPTIONS="--openssl-legacy-provider"

# Install frontend dependencies
RUN npm install --legacy-peer-deps

# Disable ESLint check during build
ENV DISABLE_ESLINT_PLUGIN=true

# Build the frontend
RUN npm run build

# Move frontend build to backend’s public folder
WORKDIR /app
RUN mv evoting-frontend/build server/public || true

# Expose backend port
EXPOSE 5000

# Start the backend server
CMD ["node", "server/server.js"]
