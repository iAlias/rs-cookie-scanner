const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { scanDomain } = require('./scanner');
const { classifyCookies } = require('./classifier');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many scan requests, please try again later.' },
});

// In-memory scan results store
const scanResults = new Map();

// POST /api/scan — start a cookie scan
app.post('/api/scan', scanLimiter, async (req, res) => {
  const { url, additionalUrls, waitTime } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format. Include the scheme (https://).' });
  }

  const parsedAdditionalUrls = [];
  if (additionalUrls && typeof additionalUrls === 'string') {
    const lines = additionalUrls.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 additional URLs allowed.' });
    }
    for (const line of lines) {
      try {
        new URL(line);
        parsedAdditionalUrls.push(line);
      } catch {
        return res.status(400).json({ error: `Invalid additional URL: ${line}` });
      }
    }
  }

  const wait = Math.min(Math.max(Number(waitTime) || 3000, 1000), 10000);

  try {
    console.log(`[SCAN] Starting scan for ${url}`);
    const rawCookies = await scanDomain(url, parsedAdditionalUrls, wait);
    const cookies = classifyCookies(rawCookies, url);

    const scanId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const result = {
      id: scanId,
      domain: new URL(url).hostname,
      scanDate: new Date().toISOString(),
      cookies,
    };

    scanResults.set(scanId, result);
    console.log(`[SCAN] Completed: ${cookies.length} cookies found for ${url}`);
    res.json(result);
  } catch (err) {
    console.error(`[SCAN] Error scanning ${url}:`, err.message);
    res.status(500).json({ error: `Scan failed: ${err.message}` });
  }
});

// GET /api/scan/:id — retrieve a scan result
app.get('/api/scan/:id', (req, res) => {
  const result = scanResults.get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Scan result not found.' });
  }
  res.json(result);
});

// PUT /api/scan/:id/cookie — update cookie metadata
app.put('/api/scan/:id/cookie', (req, res) => {
  const result = scanResults.get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Scan result not found.' });
  }

  const { name, domain, category, provider, description } = req.body;
  if (!name || !domain) {
    return res.status(400).json({ error: 'Cookie name and domain are required.' });
  }

  const cookie = result.cookies.find((c) => c.name === name && c.domain === domain);
  if (!cookie) {
    return res.status(404).json({ error: 'Cookie not found.' });
  }

  const validCategories = ['necessary', 'analytics', 'marketing', 'preferences', 'unknown'];
  if (category !== undefined) {
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }
    cookie.category = category;
  }
  if (provider !== undefined) cookie.provider = provider;
  if (description !== undefined) cookie.description = String(description).slice(0, 500);

  res.json(cookie);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SERVER] Cookie Scanner running on http://localhost:${PORT}`);
  });
}

module.exports = { app };
