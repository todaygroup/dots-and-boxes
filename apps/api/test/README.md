# E2E Test Setup Instructions

## Issue
E2E tests require DATABASE_URL configuration but currently fail with connection errors.

## Solution Options

### Option 1: Use Test Database (Recommended)
Create a separate test database to avoid interfering with development data.

```bash
# Create test database
createdb dots_boxes_test

# Set environment variable before running tests
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/dots_boxes_test"
npm run test:e2e

# Or on Unix/Mac:
DATABASE_URL="postgresql://postgres:password@localhost:5432/dots_boxes_test" npm run test:e2e
```

### Option 2: Use In-Memory Database
For faster tests without external dependencies, use SQLite in-memory:

```bash
# Install SQLite Prisma provider
npm install --save-dev @prisma/client

# Use SQLite for tests
DATABASE_URL="file::memory:?cache=shared" npm run test:e2e
```

### Option 3: Update Test Configuration
Create `.env.test` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dots_boxes_test"
JWT_SECRET="test-secret-key"
```

Update `test/jest-e2e.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "setupFiles": ["<rootDir>/setup-test-env.ts"]
}
```

Create `test/setup-test-env.ts`:
```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
```

## Current Status
✅ **TypeScript errors fixed** - All schema field name mismatches corrected
❌ **Tests not runnable** - Requires DATABASE_URL environment variable setup

## What Was Fixed
1. `dbSession.width` → `dbSession.boardWidth`
2. `dbSession.height` → `dbSession.boardHeight`
3. `moves[0].type/row/col` → `moves[0].edgeKey` (Move schema uses edgeKey string)

All TypeScript compilation errors resolved. Tests will run once database connection is configured.
