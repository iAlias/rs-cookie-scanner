/**
 * Known cookie classification rules.
 * Maps cookie name patterns to category/provider/description.
 */
const KNOWN_COOKIES = [
  { pattern: /^_ga$/i, category: 'analytics', provider: 'Google', description: 'Google Analytics: used to distinguish users.' },
  { pattern: /^_ga_/i, category: 'analytics', provider: 'Google', description: 'Google Analytics: maintains session state.' },
  { pattern: /^_gid$/i, category: 'analytics', provider: 'Google', description: 'Google Analytics: used to distinguish users (24h).' },
  { pattern: /^_gat/i, category: 'analytics', provider: 'Google', description: 'Google Analytics: used to throttle request rate.' },
  { pattern: /^_fbp$/i, category: 'marketing', provider: 'Facebook', description: 'Facebook Pixel: tracks visits across websites.' },
  { pattern: /^_fbc$/i, category: 'marketing', provider: 'Facebook', description: 'Facebook: stores click identifier.' },
  { pattern: /^fr$/i, category: 'marketing', provider: 'Facebook', description: 'Facebook: delivers advertisements.' },
  { pattern: /^IDE$/i, category: 'marketing', provider: 'Google', description: 'Google DoubleClick: ad targeting.' },
  { pattern: /^NID$/i, category: 'marketing', provider: 'Google', description: 'Google: stores preferences and information.' },
  { pattern: /^__gads$/i, category: 'marketing', provider: 'Google', description: 'Google AdSense: measures ad interactions.' },
  { pattern: /^_gcl_/i, category: 'marketing', provider: 'Google', description: 'Google Ads: conversion linker.' },
  { pattern: /^__utm/i, category: 'analytics', provider: 'Google', description: 'Google Analytics: classic tracking parameter.' },
  { pattern: /^_hjSessionUser/i, category: 'analytics', provider: 'Hotjar', description: 'Hotjar: ensures data is sent to the correct session.' },
  { pattern: /^_hjSession$/i, category: 'analytics', provider: 'Hotjar', description: 'Hotjar: current session data.' },
  { pattern: /^_hjid$/i, category: 'analytics', provider: 'Hotjar', description: 'Hotjar: unique user identifier.' },
  { pattern: /^_pk_id/i, category: 'analytics', provider: 'Matomo', description: 'Matomo: unique visitor ID.' },
  { pattern: /^_pk_ses/i, category: 'analytics', provider: 'Matomo', description: 'Matomo: session cookie.' },
  { pattern: /^PHPSESSID$/i, category: 'necessary', provider: '', description: 'PHP session identifier.' },
  { pattern: /^JSESSIONID$/i, category: 'necessary', provider: '', description: 'Java servlet session identifier.' },
  { pattern: /^csrftoken$/i, category: 'necessary', provider: '', description: 'CSRF protection token.' },
  { pattern: /^__cfduid$/i, category: 'necessary', provider: 'Cloudflare', description: 'Cloudflare: security cookie for identifying trusted traffic.' },
  { pattern: /^cf_clearance$/i, category: 'necessary', provider: 'Cloudflare', description: 'Cloudflare: clearance cookie after challenge.' },
  { pattern: /^wordpress_/i, category: 'necessary', provider: 'WordPress', description: 'WordPress: authentication/session.' },
  { pattern: /^wp-settings/i, category: 'preferences', provider: 'WordPress', description: 'WordPress: user interface settings.' },
  { pattern: /^lang$/i, category: 'preferences', provider: '', description: 'Language preference.' },
  { pattern: /^locale$/i, category: 'preferences', provider: '', description: 'Locale preference.' },
  { pattern: /^consent/i, category: 'necessary', provider: '', description: 'Cookie consent status.' },
  { pattern: /^cookieconsent/i, category: 'necessary', provider: '', description: 'Cookie consent status.' },
];

/**
 * Determine if a cookie is first-party or third-party relative to the scanned domain.
 * @param {string} cookieDomain - The cookie's domain
 * @param {string} scannedUrl - The URL that was scanned
 * @returns {string} "first" or "third"
 */
function getPartyType(cookieDomain, scannedUrl) {
  const scannedHostname = new URL(scannedUrl).hostname;
  const cleanCookieDomain = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;

  if (
    scannedHostname === cleanCookieDomain ||
    scannedHostname.endsWith('.' + cleanCookieDomain)
  ) {
    return 'first';
  }
  return 'third';
}

/**
 * Classify a list of raw Playwright cookies with metadata.
 * @param {Array} rawCookies - Cookies from Playwright context.cookies()
 * @param {string} scannedUrl - The primary URL scanned
 * @returns {Array} Classified cookies
 */
function classifyCookies(rawCookies, scannedUrl) {
  return rawCookies.map((cookie) => {
    const match = KNOWN_COOKIES.find((rule) => rule.pattern.test(cookie.name));
    const partyType = getPartyType(cookie.domain, scannedUrl);

    return {
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path || '/',
      partyType,
      httpOnly: Boolean(cookie.httpOnly),
      secure: Boolean(cookie.secure),
      sameSite: cookie.sameSite || 'None',
      expires: cookie.expires || -1,
      category: match ? match.category : 'unknown',
      provider: match ? match.provider : '',
      description: match ? match.description : '',
    };
  });
}

module.exports = { classifyCookies, getPartyType, KNOWN_COOKIES };
