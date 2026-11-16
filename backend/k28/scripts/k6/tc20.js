import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:8081';
const PASSWORD = __ENV.LOAD_PASSWORD || 'Vocab@12345';
const VUS = Number(__ENV.VUS || 50);
const appErrors = new Rate('app_errors');

export const options = {
  noCookiesReset: true,
  scenarios: {
    learners: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: VUS },
        { duration: __ENV.HOLD || '2m', target: VUS },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    'http_req_duration{endpoint:today}': ['p(95)<800'],
    'http_req_duration{endpoint:decks}': ['p(95)<800'],
    'http_req_duration{endpoint:library}': ['p(95)<800'],
    'http_req_duration{endpoint:stats}': ['p(95)<800'],
    app_errors: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max'],
};

let session = null;

function csrf() {
  const res = http.get(`${BASE}/api/v1/auth/csrf`, { tags: { endpoint: 'auth' } });
  return res.json('token');
}

function login() {
  const email = `load${String(((__VU - 1) % 50) + 1).padStart(2, '0')}@vocab.local`;
  let token = csrf();
  const res = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({ email, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
    tags: { endpoint: 'auth' },
  });
  check(res, { 'login 200': (r) => r.status === 200 });
  token = csrf();
  const decks = http.get(`${BASE}/api/v1/decks?size=1`, { tags: { endpoint: 'setup' } });
  if (decks.status === 200 && decks.json('totalElements') === 0) {
    const lib = http.get(`${BASE}/api/v1/library/decks?nguon=MAU&size=1`, { tags: { endpoint: 'setup' } });
    const id = lib.json('items.0.id');
    if (id) {
      http.post(`${BASE}/api/v1/decks/${id}/copy`, null, {
        headers: { 'X-XSRF-TOKEN': token, 'Idempotency-Key': `load-${email.split('@')[0]}` },
        tags: { endpoint: 'setup' },
      });
    }
  }
  return { email };
}

function get(path, endpoint) {
  const res = http.get(`${BASE}${path}`, { tags: { endpoint } });
  const ok = check(res, { [`${endpoint} 200`]: (r) => r.status === 200 });
  appErrors.add(!ok);
  return res;
}

export default function () {
  if (!session) {
    session = login();
  }
  get('/api/v1/learning/today', 'today');
  sleep(1);
  get('/api/v1/decks?page=0&size=20', 'decks');
  sleep(1);
  get('/api/v1/library/decks?page=0&size=20', 'library');
  sleep(1);
  get('/api/v1/statistics/overview', 'stats');
  sleep(1);
}
