# 🚀 REMIS APP - Deployment Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ accessible
- Redis 7+ accessible
- GitHub account
- Railway/Render account
- Expo account (for EAS)
- AWS S3 or Cloudinary account (for file storage)

---

## Environment Variables

### Backend (.env)

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@host:5432/remis_db?schema=public

# Redis
REDIS_HOST=redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_change_this
REFRESH_TOKEN_EXPIRES_IN=7d

# File Upload
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=remis-documents

# Or Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token

# Monitoring
SENTRY_DSN=https://your-sentry-dsn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Mobile (.env)

```bash
EXPO_PUBLIC_API_URL=https://api-remis.railway.app/api/v1
EXPO_PUBLIC_WS_URL=wss://api-remis.railway.app
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE remis_db;
```

### 2. Run Prisma Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 3. Seed Initial Data (Optional)

```bash
npx prisma db seed
```

---

## Backend Deployment (Railway)

### Option A: Deploy via GitHub Integration

1. **Push code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-repo/remis-backend.git
   git push -u origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway auto-detects NestJS and creates a service

3. **Add PostgreSQL**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway provides DATABASE_URL automatically

4. **Add Redis**
   - Click "New" → "Database" → "Redis"
   - Railway provides Redis connection details

5. **Configure Environment Variables**
   - Go to your service → "Variables"
   - Add all variables from `.env` template
   - DATABASE_URL and Redis variables are auto-populated

6. **Deploy**
   - Railway auto-deploys on every push to main
   - View logs in Railway dashboard

### Option B: Deploy via Docker

1. **Build Docker Image**

   ```bash
   docker build -t remis-backend .
   ```

2. **Push to Railway**
   ```bash
   railway login
   railway link
   railway up
   ```

### Dockerfile (backend/Dockerfile)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

---

## Frontend Deployment (Expo EAS)

### 1. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 2. Configure EAS

```bash
cd mobile
eas build:configure
```

This creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Update app.json

```json
{
  "expo": {
    "name": "Remis App",
    "slug": "remis-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2563EB"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.remisapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2563EB"
      },
      "package": "com.yourcompany.remisapp"
    },
    "plugins": ["expo-notifications"],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 4. Build for Android

```bash
# Development build (for testing)
eas build --platform android --profile development

# APK for internal testing
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

### 5. Build for iOS

```bash
# Simulator build
eas build --platform ios --profile development

# TestFlight build
eas build --platform ios --profile production
```

### 6. Submit to Stores

```bash
# Android (Play Store)
eas submit --platform android

# iOS (App Store)
eas submit --platform ios
```

---

## CI/CD with GitHub Actions

### .github/workflows/backend.yml

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run Prisma migrations
        run: |
          cd backend
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run tests
        run: |
          cd backend
          npm run test

      - name: Build
        run: |
          cd backend
          npm run build
```

---

## Monitoring & Logging

### 1. Setup Sentry

```bash
npm install @sentry/node @sentry/integrations
```

```typescript
// main.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Setup Logging

```bash
npm install winston
```

```typescript
// logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}
```

---

## SSL Certificate

Railway provides automatic HTTPS with Let's Encrypt certificates.

For custom domains:

1. Add custom domain in Railway dashboard
2. Update DNS records (CNAME pointing to Railway)
3. Certificate is auto-provisioned

---

## Database Backups

### Automated Backups (Railway)

Railway provides automatic daily backups for PostgreSQL.

### Manual Backup

```bash
# Connect to Railway
railway connect PostgreSQL

# Manual backup
pg_dump -h host -U user -d remis_db > backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
psql -h host -U user -d remis_db < backup_20260210.sql
```

---

## Performance Optimization

### 1. Enable Compression

```bash
npm install compression
```

```typescript
// main.ts
import compression from "compression";

app.use(compression());
```

### 2. Cache Static Assets

```typescript
app.useStaticAssets(join(__dirname, "..", "public"), {
  maxAge: "1d",
});
```

### 3. Database Connection Pooling

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Prisma default pooling
  connection_limit = 10
}
```

---

## Health Checks

```typescript
// health.controller.ts
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get("db")
  async checkDatabase(@Res() res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: "ok" });
    } catch (error) {
      res.status(503).json({ status: "error" });
    }
  }

  @Get("redis")
  async checkRedis(@Res() res: Response) {
    try {
      await this.redis.ping();
      res.status(200).json({ status: "ok" });
    } catch (error) {
      res.status(503).json({ status: "error" });
    }
  }
}
```

---

## Rollback Strategy

### Backend Rollback

```bash
# Railway CLI rollback to previous deployment
railway rollback

# Or via Railway dashboard: Deployments → Select previous → Redeploy
```

### Mobile Rollback

```bash
# Create a new build with previous code
git checkout <previous-commit>
eas build --platform all --profile production
eas submit
```

**Note**: Mobile rollbacks are slower due to app store approval process.

---

## Post-Deployment Checklist

- [ ] Verify HTTPS is working
- [ ] Test health check endpoint
- [ ] Test database connection
- [ ] Test Redis connection
- [ ] Test file upload to S3/Cloudinary
- [ ] Test push notifications
- [ ] Test WebSocket connections
- [ ] Verify logs are being collected
- [ ] Verify error tracking is working
- [ ] Test rate limiting
- [ ] Load test with 100 concurrent users
- [ ] Monitor memory and CPU usage
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Set up performance monitoring
- [ ] Document deployment procedures
- [ ] Share access credentials with team (1Password, etc.)

---

## Disaster Recovery

### Database Disaster Recovery

1. **Daily automated backups** (Railway handles this)
2. **Manual backup before major changes**
3. **Test restore process monthly**
4. **Keep backups for 30 days**
5. **Offsite backup to S3** (optional)

### Redis Disaster Recovery

Redis is used for cache and ephemeral data only. No critical data loss if Redis fails.

- Refresh tokens: Users will need to re-login
- Rate limiting: Resets (acceptable)

### Application Disaster Recovery

- **Multiple deployment regions** (future)
- **Database read replicas** (future)
- **CDN for static assets** (future)
- **Load balancer** (future)
