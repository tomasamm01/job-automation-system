# Setup Guide - Job Scraper Engine

## Prerequisites

- Node.js 18+ and npm
- Backend API running (or accessible URL)
- PostgreSQL database (for backend)

## Installation Steps

### 1. Navigate to Scraper Directory

```bash
cd scraper
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `axios` - HTTP client
- `cheerio` - HTML parsing (for web scraping)
- `dotenv` - Environment configuration
- `node-cron` - Job scheduling
- `winston` - Logging
- TypeScript and development tools

### 3. Create Environment File

```bash
cp env.template .env
```

### 4. Configure Environment Variables

Edit `.env` file:

```env
# Backend Configuration
BACKEND_URL=http://localhost:5000
BACKEND_API_KEY=your-api-key-here
BACKEND_TIMEOUT=30000
BACKEND_RETRIES=3

# Scraper Configuration
BATCH_SIZE=50
CONCURRENCY=3
USER_AGENT=JobScraperBot/1.0

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Source Configuration
REMOTEOK_ENABLED=true
REMOTEOK_SCHEDULE=*/30 * * * *

LINKEDIN_ENABLED=false
LINKEDIN_SCHEDULE=0 */2 * * *

GETONBOARD_ENABLED=false
GETONBOARD_SCHEDULE=0 */3 * * *
```

### 5. Create Logs Directory

```bash
mkdir logs
```

### 6. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### 7. Run the Scraper

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## Verification

### Check Backend Connection

The scraper will automatically check backend health on startup. You should see:

```
[info] Checking backend health...
[info] Backend is healthy
```

If backend is not accessible:
```
[warn] Backend health check failed, but continuing...
```

### Monitor Logs

Watch the console output or check log files:

```bash
tail -f logs/combined.log
```

Expected output:
```json
{"level":"info","message":"=== Job Scraper Engine Starting ===","timestamp":"2024-03-20 10:00:00"}
{"level":"info","message":"Backend is healthy","timestamp":"2024-03-20 10:00:01"}
{"level":"info","message":"Registered normalizer for RemoteOK","timestamp":"2024-03-20 10:00:01"}
{"level":"info","message":"Registered RemoteOK with schedule: */30 * * * *","timestamp":"2024-03-20 10:00:01"}
{"level":"info","message":"Starting scheduler","timestamp":"2024-03-20 10:00:01"}
{"level":"info","message":"=== Scraper Engine Running ===","timestamp":"2024-03-20 10:00:01"}
```

### Test Manual Run

You can trigger a manual scrape by modifying `src/index.ts` temporarily:

```typescript
// After scheduler.start(), add:
await scheduler.runNow('RemoteOK');
```

## Directory Structure After Setup

```
/scraper
  /dist                 # Compiled JavaScript (generated)
  /logs                 # Log files (generated)
    combined.log
    error.log
  /node_modules         # Dependencies (generated)
  /src                  # Source code
    /config
    /normalizers
    /services
    /sources
    /types
    /utils
    index.ts
  .env                  # Your configuration (created)
  .gitignore
  env.template
  package.json
  tsconfig.json
  README.md
  ARCHITECTURE.md
  SETUP.md
```

## Common Issues

### Issue: "Cannot find module 'dotenv'"

**Solution:** Run `npm install`

### Issue: "Backend health check failed"

**Causes:**
1. Backend is not running
2. Wrong `BACKEND_URL` in `.env`
3. Network/firewall issues

**Solution:**
```bash
# Test backend manually
curl http://localhost:5000/health

# Or check if backend is running
curl http://localhost:5000/api/jobs/ingest -X POST -H "Content-Type: application/json" -d '[]'
```

### Issue: "No jobs found"

**Causes:**
1. Source API is down
2. Rate limits hit
3. Source is disabled

**Solution:**
- Check source is enabled in `.env`
- Review logs for specific errors
- Verify source API is accessible

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Issue: Permission denied on logs directory

**Solution:**
```bash
mkdir -p logs
chmod 755 logs
```

## Running in Production

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start scraper
pm2 start dist/index.js --name job-scraper

# View logs
pm2 logs job-scraper

# Monitor
pm2 monit

# Auto-restart on system reboot
pm2 startup
pm2 save
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

RUN mkdir -p logs

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t job-scraper .
docker run -d --name job-scraper --env-file .env job-scraper
```

### Using systemd

Create `/etc/systemd/system/job-scraper.service`:

```ini
[Unit]
Description=Job Scraper Engine
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/job-scraper
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable job-scraper
sudo systemctl start job-scraper
sudo systemctl status job-scraper
```

## Monitoring

### Health Checks

Create a simple health check endpoint or script:

```bash
#!/bin/bash
# check-scraper.sh

if pm2 list | grep -q "job-scraper.*online"; then
  echo "Scraper is running"
  exit 0
else
  echo "Scraper is down"
  exit 1
fi
```

### Log Monitoring

Use tools like:
- **Logrotate** - Rotate log files
- **Loki** - Centralized logging
- **Datadog** - APM and monitoring
- **Sentry** - Error tracking

### Metrics to Track

1. **Jobs scraped per source**
2. **Success/failure rate**
3. **API response times**
4. **Error frequency**
5. **Backend ingestion rate**

## Scaling

### Horizontal Scaling

Run multiple instances with different source configurations:

**Instance 1** (Fast sources):
```env
REMOTEOK_ENABLED=true
LINKEDIN_ENABLED=false
GETONBOARD_ENABLED=false
```

**Instance 2** (Slow sources):
```env
REMOTEOK_ENABLED=false
LINKEDIN_ENABLED=true
GETONBOARD_ENABLED=true
```

### Vertical Scaling

Increase concurrency and batch size:

```env
BATCH_SIZE=100
CONCURRENCY=5
```

## Security Best Practices

1. **Never commit `.env` file**
2. **Rotate API keys regularly**
3. **Use environment-specific configs**
4. **Implement rate limiting**
5. **Monitor for abuse**
6. **Use HTTPS for backend communication**

## Troubleshooting Commands

```bash
# Check if scraper is running
ps aux | grep node

# View recent logs
tail -n 100 logs/combined.log

# View errors only
tail -f logs/error.log

# Test backend connectivity
curl -v http://localhost:5000/health

# Check cron schedule syntax
npx cron-validate "*/30 * * * *"

# Rebuild from scratch
rm -rf dist node_modules
npm install
npm run build
npm start
```

## Next Steps

1. **Implement additional sources** (LinkedIn, GetOnBoard, etc.)
2. **Add monitoring dashboard**
3. **Set up alerting for failures**
4. **Optimize scraping schedules**
5. **Add unit tests**
6. **Configure CI/CD pipeline**

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review `README.md` for architecture details
3. Check `ARCHITECTURE.md` for design patterns
4. Create an issue in the repository
