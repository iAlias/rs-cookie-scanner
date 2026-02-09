const { chromium } = require('playwright');

/**
 * Common selectors for cookie consent "accept" buttons across popular CMPs.
 */
const CONSENT_SELECTORS = [
  'button:has-text("Accetta")',
  'button:has-text("Accept")',
  'button:has-text("Accetto")',
  'button:has-text("Accept all")',
  'button:has-text("Accetta tutti")',
  'button:has-text("Accetta tutto")',
  'button:has-text("Consenti")',
  'button:has-text("OK")',
  'button:has-text("Agree")',
  'a:has-text("Accetta")',
  'a:has-text("Accept")',
  '[id*="accept" i]',
  '[class*="accept" i]',
  '[id*="consent" i][role="button"]',
  '#onetrust-accept-btn-handler',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '.cc-accept',
  '.cc-allow',
];

/**
 * Attempt to click a cookie consent "accept" button on the page.
 * @param {import('playwright').Page} page
 */
async function tryAcceptConsent(page) {
  for (const selector of CONSENT_SELECTORS) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 500 })) {
        console.log(`[SCANNER] Clicking consent button: ${selector}`);
        await el.click();
        await page.waitForTimeout(1500);
        return true;
      }
    } catch {
      // selector not found or not visible, try next
    }
  }
  return false;
}

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
    for (let i = 0; i < allUrls.length; i++) {
      const url = allUrls[i];
      console.log(`[SCANNER] Navigating to ${url}`);
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(waitTime);

        // On the first page, try to accept cookie consent to unlock more cookies
        if (i === 0) {
          await tryAcceptConsent(page);
          await page.waitForTimeout(waitTime);
        }
      } catch (err) {
        console.warn(`[SCANNER] Warning navigating to ${url}: ${err.message}`);
        // If the main URL fails to load, throw so the user gets a clear error
        if (i === 0) {
          const msg = err.message || '';
          if (msg.includes('ERR_NAME_NOT_RESOLVED')) {
            throw new Error(`Could not resolve domain. Check that the URL is correct and the site is online.`);
          }
          if (msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('ERR_CONNECTION_TIMED_OUT')) {
            throw new Error(`Could not connect to the site. The server may be down or unreachable.`);
          }
        }
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
