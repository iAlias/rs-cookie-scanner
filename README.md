# Cookie Scanner

A web application for scanning websites for cookies and classifying them for GDPR compliance. Built with Node.js, Express, Playwright, and React.

## Features

- **Browser-based scanning**: Uses Playwright (Chromium) to navigate websites and collect cookies just like a real browser
- **Cookie deduplication**: Automatically deduplicates cookies by name + domain
- **First/Third party detection**: Automatically classifies cookies as first-party or third-party
- **Auto-classification**: Known cookies (Google Analytics, Facebook Pixel, etc.) are automatically categorized
- **Manual editing**: Edit category, provider, and description for each cookie inline
- **JSON export**: Export the full cookie catalog as a JSON file
- **Responsive UI**: Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install server dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Install client dependencies
cd client && npm install && cd ..
```

### Development

```bash
# Run both server and client in dev mode
npm run dev
```

- Server runs on `http://localhost:3001`
- Client runs on `http://localhost:5173` (with proxy to server)

### Production

```bash
# Build the client
npm run build

# Start the server (serves client build)
npm start
```

### Docker

```bash
docker build -t cookie-scanner .
docker run -p 3001:3001 cookie-scanner
```

## Usage

1. Open the application in your browser
2. Enter a domain/URL (e.g., `https://example.com`)
3. Optionally add additional URLs to scan (one per line, max 10)
4. Adjust the wait time if needed (default: 3000ms)
5. Click **Start Scan**
6. View the results table with all detected cookies
7. Edit categories, providers, and descriptions as needed
8. Click **Export JSON** to download the cookie catalog

## API Endpoints

### POST /api/scan

Start a cookie scan.

**Request body:**
```json
{
  "url": "https://example.com",
  "additionalUrls": "https://example.com/about\nhttps://example.com/contact",
  "waitTime": 3000
}
```

**Response:**
```json
{
  "id": "scan-id",
  "domain": "example.com",
  "scanDate": "2024-01-01T00:00:00.000Z",
  "cookies": [...]
}
```

### GET /api/scan/:id

Retrieve a scan result by ID.

### PUT /api/scan/:id/cookie

Update cookie metadata (category, provider, description).

**Request body:**
```json
{
  "name": "_ga",
  "domain": ".example.com",
  "category": "analytics",
  "provider": "Google",
  "description": "Used to distinguish users"
}
```

## Export Format

```json
{
  "domain": "example.com",
  "scanDate": "2024-01-01T00:00:00.000Z",
  "cookies": [
    {
      "name": "_ga",
      "domain": ".example.com",
      "category": "analytics",
      "provider": "Google",
      "description": "Used to distinguish users",
      "httpOnly": false,
      "secure": true,
      "sameSite": "Lax",
      "expires": 1780000000
    }
  ]
}
```

## Tech Stack

- **Backend**: Node.js, Express
- **Scanner**: Playwright (Chromium)
- **Frontend**: React, Vite
- **Styling**: Vanilla CSS
- **Containerization**: Docker

## Cookie Categories

| Category | Description |
|---|---|
| necessary | Essential for website functionality |
| analytics | Used for website analytics and statistics |
| marketing | Used for advertising and tracking |
| preferences | Store user preferences |
| unknown | Not yet classified |