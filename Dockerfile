FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api ./apps/api

# Generate Prisma client (prisma is inside apps/api)
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Build the application
RUN npm run build --workspace=api

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start:prod", "--workspace=api"]
