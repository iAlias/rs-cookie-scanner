const { classifyCookies, getPartyType, KNOWN_COOKIES } = require('../server/src/classifier');

describe('getPartyType', () => {
  test('returns "first" for exact hostname match', () => {
    expect(getPartyType('example.com', 'https://example.com')).toBe('first');
  });

  test('returns "first" for domain with leading dot', () => {
    expect(getPartyType('.example.com', 'https://example.com')).toBe('first');
  });

  test('returns "first" for subdomain match', () => {
    expect(getPartyType('.example.com', 'https://www.example.com')).toBe('first');
  });

  test('returns "third" for different domain', () => {
    expect(getPartyType('.google.com', 'https://example.com')).toBe('third');
  });

  test('returns "third" for unrelated domain', () => {
    expect(getPartyType('facebook.com', 'https://example.com')).toBe('third');
  });
});

describe('classifyCookies', () => {
  const scannedUrl = 'https://example.com';

  test('classifies known analytics cookies', () => {
    const rawCookies = [
      { name: '_ga', domain: '.example.com', path: '/', httpOnly: false, secure: true, sameSite: 'Lax', expires: 1780000000 },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('analytics');
    expect(result[0].provider).toBe('Google');
    expect(result[0].partyType).toBe('first');
  });

  test('classifies known marketing cookies', () => {
    const rawCookies = [
      { name: '_fbp', domain: '.facebook.com', path: '/', httpOnly: false, secure: true, sameSite: 'None', expires: 1780000000 },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].category).toBe('marketing');
    expect(result[0].provider).toBe('Facebook');
    expect(result[0].partyType).toBe('third');
  });

  test('classifies Microsoft Clarity cookies', () => {
    const rawCookies = [
      { name: '_clck', domain: '.example.com', path: '/', httpOnly: false, secure: true },
      { name: '_clsk', domain: '.example.com', path: '/', httpOnly: false, secure: true },
      { name: 'CLID', domain: '.clarity.ms', path: '/', httpOnly: false, secure: true },
      { name: 'ANONCHK', domain: '.c.clarity.ms', path: '/', httpOnly: false, secure: true },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].category).toBe('analytics');
    expect(result[0].provider).toBe('Microsoft');
    expect(result[1].category).toBe('analytics');
    expect(result[1].provider).toBe('Microsoft');
    expect(result[2].category).toBe('analytics');
    expect(result[2].provider).toBe('Microsoft');
    expect(result[2].partyType).toBe('third');
    expect(result[3].category).toBe('analytics');
    expect(result[3].provider).toBe('Microsoft');
  });

  test('classifies Meta/Facebook cookies', () => {
    const rawCookies = [
      { name: '_fbq', domain: '.example.com', path: '/', httpOnly: false, secure: true },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].category).toBe('marketing');
    expect(result[0].provider).toBe('Facebook');
  });

  test('classifies TikTok cookies', () => {
    const rawCookies = [
      { name: '_tt_enable_cookie', domain: '.example.com', path: '/' },
      { name: '_ttp', domain: '.example.com', path: '/' },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].category).toBe('marketing');
    expect(result[0].provider).toBe('TikTok');
    expect(result[1].category).toBe('marketing');
    expect(result[1].provider).toBe('TikTok');
  });

  test('classifies LinkedIn cookies', () => {
    const rawCookies = [
      { name: 'li_sugr', domain: '.linkedin.com', path: '/' },
      { name: 'bcookie', domain: '.linkedin.com', path: '/' },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].category).toBe('marketing');
    expect(result[0].provider).toBe('LinkedIn');
    expect(result[1].category).toBe('marketing');
    expect(result[1].provider).toBe('LinkedIn');
  });

  test('classifies unknown cookies with default values', () => {
    const rawCookies = [
      { name: 'custom_cookie', domain: '.example.com', path: '/', httpOnly: true, secure: false },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].category).toBe('unknown');
    expect(result[0].provider).toBe('');
    expect(result[0].description).toBe('');
  });

  test('preserves httpOnly and secure flags', () => {
    const rawCookies = [
      { name: 'session', domain: '.example.com', path: '/', httpOnly: true, secure: true },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].httpOnly).toBe(true);
    expect(result[0].secure).toBe(true);
  });

  test('handles missing sameSite with default', () => {
    const rawCookies = [
      { name: 'test', domain: '.example.com', path: '/' },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].sameSite).toBe('None');
  });

  test('handles missing expires', () => {
    const rawCookies = [
      { name: 'test', domain: '.example.com', path: '/' },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].expires).toBe(-1);
  });

  test('handles missing path', () => {
    const rawCookies = [
      { name: 'test', domain: '.example.com' },
    ];

    const result = classifyCookies(rawCookies, scannedUrl);
    expect(result[0].path).toBe('/');
  });
});

describe('KNOWN_COOKIES patterns', () => {
  test('contains patterns for major analytics providers', () => {
    const analyticsPatterns = KNOWN_COOKIES.filter((r) => r.category === 'analytics');
    expect(analyticsPatterns.length).toBeGreaterThan(0);
  });

  test('contains patterns for marketing providers', () => {
    const marketingPatterns = KNOWN_COOKIES.filter((r) => r.category === 'marketing');
    expect(marketingPatterns.length).toBeGreaterThan(0);
  });

  test('contains patterns for necessary cookies', () => {
    const necessaryPatterns = KNOWN_COOKIES.filter((r) => r.category === 'necessary');
    expect(necessaryPatterns.length).toBeGreaterThan(0);
  });
});
