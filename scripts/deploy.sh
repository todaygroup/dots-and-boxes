#!/bin/bash
# Production Deployment Script for Dots and Boxes

set -e  # Exit on error

echo "🚀 Starting Dots and Boxes deployment..."

# Configuration
APP_DIR="/var/www/dots-and-boxes"
API_DIR="$APP_DIR/apps/api"
WEB_DIR="$APP_DIR/apps/web"
BACKUP_DIR="/var/backups/dots-and-boxes"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating backup...${NC}"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf $BACKUP_FILE $APP_DIR
echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"

echo -e "${YELLOW}Step 2: Pulling latest code...${NC}"
cd $APP_DIR
git fetch origin
git checkout main
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"
npm ci
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "${YELLOW}Step 4: Building packages...${NC}"
cd packages/game-logic
npm run build
cd ../..
echo -e "${GREEN}✓ Game logic built${NC}"

echo -e "${YELLOW}Step 5: Running database migrations...${NC}"
cd $API_DIR
npx prisma migrate deploy
npx prisma generate
echo -e "${GREEN}✓ Migrations complete${NC}"

echo -e "${YELLOW}Step 6: Building API...${NC}"
npm run build
echo -e "${GREEN}✓ API built${NC}"

echo -e "${YELLOW}Step 7: Building Web...${NC}"
cd $WEB_DIR
npm run build
echo -e "${GREEN}✓ Web built${NC}"

echo -e "${YELLOW}Step 8: Restarting services...${NC}"
# Using PM2 for process management
pm2 restart dots-api || pm2 start $API_DIR/dist/main.js --name dots-api
pm2 restart dots-web || pm2 start npm --name dots-web -- start
pm2 save
echo -e "${GREEN}✓ Services restarted${NC}"

echo -e "${YELLOW}Step 9: Running health checks...${NC}"
sleep 5
curl -f http://localhost:4000/ || echo "⚠️  API health check failed"
curl -f http://localhost:3000/ || echo "⚠️  Web health check failed"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Backup location: $BACKUP_FILE"
echo "Check logs: pm2 logs"
echo "Rollback: tar -xzf $BACKUP_FILE -C /"
