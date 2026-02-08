FROM node:20-alpine

WORKDIR /app

# Copy all package files for workspaces
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/game-logic/package*.json ./packages/game-logic/

# Install ALL dependencies (including devDependencies for build)
RUN npm install --include=dev

# Copy game-logic source and build
COPY packages/game-logic ./packages/game-logic
RUN npm run build --workspace=@dots-game/game-logic

# Copy API source
COPY apps/api ./apps/api

# Generate Prisma client
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Build the API
RUN npm run build --workspace=api

# Remove devDependencies for smaller image
RUN npm prune --production

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start:prod", "--workspace=api"]
