# Corgi Enrichment App

A full-stack lead enrichment tool for Corgi insurance agency prospecting.

## Stack
- **Frontend/API**: Next.js 15 App Router (TypeScript)
- **Database**: PostgreSQL via Drizzle ORM
- **UI**: Tailwind CSS (dark mode)
- **Deployment**: Railway

## Quick Start

### 1. Set environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL=postgresql://...
API_KEY=your-secret-key         # Used by agents in X-API-Key header
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-secret-key  # Same key, used by browser UI
```

### 2. Set up the database

```bash
npm run db:push
```

### 3. Run development server

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Railway

### First-time setup

```bash
# Login (opens browser)
railway login

# Initialize project
cd corgi-enrichment-app
railway init

# Add PostgreSQL
railway add -d postgres

# Set environment variables
railway variables set API_KEY=$(openssl rand -hex 32)
# Copy the same value as NEXT_PUBLIC_API_KEY
railway variables set NEXT_PUBLIC_API_KEY=<same-key>

# Deploy
railway up

# Get URL
railway status
```

### After deployment

Run database migrations:
```bash
railway run npm run db:push
```

## API Reference

All endpoints require `X-API-Key: <API_KEY>` header.

### Leads
- `GET /api/leads` — List/filter leads (`?status=New&state=TX&limit=50&offset=0&search=...`)
- `POST /api/leads` — Create lead (auto-deduplicates)
- `GET /api/leads/:id` — Get lead by ID
- `PATCH /api/leads/:id` — Update lead (add `X-Human-Edit: true` for status/notes)
- `POST /api/leads/batch` — Batch create (up to 50)
- `GET /api/leads/domains` — Get all domains (for dedup)
- `GET /api/leads/stats` — Dashboard statistics
- `POST /api/leads/dedup-check` — Check before inserting

### Tasks
- `GET /api/tasks/next?type=verify` — Claim next task (atomically)
- `PATCH /api/tasks/:id` — Update task status/result
- `POST /api/tasks` — Create task
- `GET /api/tasks` — List tasks

### Agent Log & Search Runs
- `POST /api/agent-log` — Log agent activity
- `GET /api/agent-log?limit=20` — Fetch recent activity
- `POST /api/search-runs` — Log a search run
- `GET /api/search-runs` — List recent search runs

### Export
- `POST /api/export/csv` — Download CSV
- `GET /api/export/history` — Export history

## Agent Integration

Agents interact via the REST API using curl or web_fetch:

```bash
# Check for duplicate before inserting
curl -X POST https://your-app.railway.app/api/leads/dedup-check \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "company_name": "Example Agency", "state": "TX"}'

# Insert a lead
curl -X POST https://your-app.railway.app/api/leads \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Example Agency", "website": "https://example.com", "state": "TX", ...}'

# Claim a verify task
curl https://your-app.railway.app/api/tasks/next?type=verify \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Agent-Name: website-verifier"

# Complete a task
curl -X PATCH https://your-app.railway.app/api/tasks/{id} \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "done", "result": {"verified": true}}'
```

## Status Colors
- New: gray
- Contacted: blue  
- Booked: green ✅
- Bad Fit: red
- Not Interested: orange
- Existing Partner: purple
- Low Interest: yellow

## Score Interpretation
- 70+ = Green (strong prospect)
- 40-69 = Yellow (moderate)
- <40 = Red (low priority)
