# Use the official Node.js image.
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy environment files
COPY .env.dev .env.prod ./

# Build the application
RUN npm run build:dev

# Expose the port the app runs on
EXPOSE 3003

# Define the command to run the app
CMD ["npm", "run", "preview", "--", "--host"]