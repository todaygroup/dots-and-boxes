FROM node:20-alpine

WORKDIR /app

# Copy package files (root and workspaces)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/game-logic/package*.json ./packages/game-logic/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api ./apps/api
COPY packages/game-logic ./packages/game-logic

# Build game-logic first
RUN npm run build --workspace=game-logic || true

# Generate Prisma client
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Build the API
RUN npm run build --workspace=api

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start:prod", "--workspace=api"]
