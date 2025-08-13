FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose ports (3000 for app, 9229 for debugger)
EXPOSE 3000 9229

# Start with nodemon for development
CMD ["npm", "run", "dev"]