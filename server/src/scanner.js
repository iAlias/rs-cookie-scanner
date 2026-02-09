const { chromium } = require('playwright');

/**
 * Scan a domain and additional URLs for cookies using Playwright.
 * Deduplicates cookies by name + domain.
 * @param {string} mainUrl - The primary URL to scan
 * @param {string[]} additionalUrls - Additional URLs to scan
 * @param {number} waitTime - Time in ms to wait for async scripts
 * @returns {Promise<Array>} Array of raw cookie objects
 */
async function scanDomain(mainUrl, additionalUrls = [], waitTime = 3000) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const allUrls = [mainUrl, ...additionalUrls];
  const cookieMap = new Map();

  try {
    for (const url of allUrls) {
      console.log(`[SCANNER] Navigating to ${url}`);
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(waitTime);
      } catch (err) {
        console.warn(`[SCANNER] Warning navigating to ${url}: ${err.message}`);
      }
      await page.close();
    }

    const cookies = await context.cookies();

    for (const cookie of cookies) {
      const key = `${cookie.name}|||${cookie.domain}`;
      if (!cookieMap.has(key)) {
        cookieMap.set(key, cookie);
      }
    }
  } finally {
    await browser.close();
  }

  return Array.from(cookieMap.values());
}

module.exports = { scanDomain };
