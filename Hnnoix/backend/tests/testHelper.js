const http = require('http');
const app = require('../server');

let testServer = null;
let baseUrl = '';

async function startTestServer() {
  if (testServer) return baseUrl;

  return new Promise((resolve) => {
    testServer = http.createServer(app);
    testServer.listen(0, '127.0.0.1', () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve(baseUrl);
    });
  });
}

async function stopTestServer() {
  if (testServer) {
    return new Promise((resolve) => {
      testServer.close(() => {
        testServer = null;
        resolve();
      });
    });
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data,
  };
}

module.exports = {
  startTestServer,
  stopTestServer,
  apiRequest,
};
