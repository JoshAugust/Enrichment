# Railway Deployment Instructions

The app is fully built and ready to deploy.

## Step 1: Login to Railway

Run this in your terminal:
```bash
cd /Users/corgi12/.eragon-joshua_augustine/workspace-default/corgi-enrichment-app
railway login
```
This opens a browser window. Log in with your Railway account.

## Step 2: Initialize Railway project

```bash
railway init
```
When prompted, name it: `corgi-enrichment`

## Step 3: Add PostgreSQL database

```bash
railway add -d postgres
```

## Step 4: Set environment variables

```bash
# Generate a secure API key
API_KEY=$(openssl rand -hex 32)

# Set both server and browser API key
railway variables set API_KEY=$API_KEY
railway variables set NEXT_PUBLIC_API_KEY=$API_KEY

# Optional: set app URL after first deploy
# railway variables set NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
```

## Step 5: Deploy

```bash
railway up
```

## Step 6: Run database migrations

After deploy:
```bash
railway run npm run db:push
```

## Step 7: Get your app URL

```bash
railway status
```

Or visit your Railway dashboard: https://railway.app/dashboard

## Step 8: Configure environment variables in Railway dashboard

In the Railway dashboard for your service:
1. Go to Variables
2. Add `NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app`

## Step 9: Test the deployment

```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Test with API key
curl https://your-app.up.railway.app/api/leads/stats \
  -H "X-Api-Key: $API_KEY"
```

## After Deployment

The app URL should be saved and shared with the agent orchestrator.
Update `agent-teams/enrichment/AGENT-PROMPT.md` with the real URL and API key.
