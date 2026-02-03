# API Keys Setup Guide

The Sentinel City app uses **free APIs by default** (no keys required), but you can optionally add API keys for better data quality.

## Current Setup (No Keys Required)

- **Pollution Data**: OpenAQ API (free, no key)
- **Temperature Data**: Open-Meteo API (free, no key)

## Optional: Add API Keys for Better Data

### Step 1: Create `.env` file

In the `frontend/` directory, create a file named `.env`:

```bash
# In frontend/.env
VITE_AIRVISUAL_API_KEY=your_airvisual_api_key_here
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### Step 2: Get API Keys

#### AirVisual API (for Pollution/AQI)
1. Go to: https://www.iqair.com/us/air-pollution-data-api
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to `.env` as `VITE_AIRVISUAL_API_KEY`

#### OpenWeatherMap API (for Temperature)
1. Go to: https://openweathermap.org/api
2. Sign up for a free account (free tier: 1,000 calls/day)
3. Get your API key from the dashboard
4. Add it to `.env` as `VITE_OPENWEATHER_API_KEY`

### Step 3: Restart Dev Server

After adding keys to `.env`, restart your frontend dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

## How It Works

- If API keys are provided, the app will use them first
- If keys are missing or invalid, it automatically falls back to free APIs
- No keys = still works perfectly with free APIs!

## Example `.env` file:

```env
VITE_AIRVISUAL_API_KEY=abc123xyz789
VITE_OPENWEATHER_API_KEY=def456uvw012
```

**Important**: Never commit your `.env` file to git! It's already in `.gitignore`.
