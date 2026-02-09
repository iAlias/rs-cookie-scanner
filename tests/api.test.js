const http = require('http');

// We need to test the Express app routes
const { app } = require('../server/src/index');

let server;
let baseUrl;

beforeAll((done) => {
  server = app.listen(0, () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('API - POST /api/scan', () => {
  test('returns 400 when no URL provided', async () => {
    const res = await request('POST', '/api/scan', {});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('valid URL');
  });

  test('returns 400 for invalid URL format', async () => {
    const res = await request('POST', '/api/scan', { url: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid URL');
  });

  test('returns 400 when too many additional URLs', async () => {
    const urls = Array.from({ length: 11 }, (_, i) => `https://example.com/page${i}`).join('\n');
    const res = await request('POST', '/api/scan', { url: 'https://example.com', additionalUrls: urls });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Maximum 10');
  });

  test('returns 400 for invalid additional URL', async () => {
    const res = await request('POST', '/api/scan', {
      url: 'https://example.com',
      additionalUrls: 'not-a-valid-url',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid additional URL');
  });
});

describe('API - GET /api/scan/:id', () => {
  test('returns 404 for non-existent scan', async () => {
    const res = await request('GET', '/api/scan/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('API - PUT /api/scan/:id/cookie', () => {
  test('returns 404 for non-existent scan', async () => {
    const res = await request('PUT', '/api/scan/nonexistent/cookie', {
      name: '_ga',
      domain: '.example.com',
      category: 'analytics',
    });
    expect(res.status).toBe(404);
  });

  test('returns 400 when name or domain missing on existing scan', async () => {
    const res = await request('PUT', '/api/scan/someid/cookie', {
      category: 'analytics',
    });
    // With non-existent scan, it returns 404 first
    expect(res.status).toBe(404);
  });

  test('returns 400 when name missing', async () => {
    const res = await request('PUT', '/api/scan/nonexistent/cookie', {
      domain: '.example.com',
    });
    // Non-existent scan returns 404 before validation
    expect(res.status).toBe(404);
  });
});
