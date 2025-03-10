# Use a Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN rm -rf node_modules package-lock.json && npm install --force

# Copy the entire project
COPY . .

# Set the working directory to frontend
WORKDIR /app/evoting-frontend

# Ensure correct Node.js options
ENV NODE_OPTIONS="--openssl-legacy-provider"

# Install frontend dependencies and build
RUN npm install --force && npm run build

# Move frontend build to backend public folder (if using Express)
WORKDIR /app
RUN mv evoting-frontend/build server/public

# Expose the port (adjust based on your backend server)
EXPOSE 5000

# Start the backend server
CMD ["node", "server/server.js"]
