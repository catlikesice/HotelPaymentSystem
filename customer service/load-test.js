// k6 load test script (adjust VUs and duration to simulate volume)
// Usage: install k6 locally or run in CI; example command: k6 run --vus 50 --duration 1m load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const URL = __ENV.TARGET_URL || 'http://localhost:3000/api/complaints';

// Helper to generate random text of approx chars characters
function randomText(chars) {
  const words = ['issue', 'payment', 'room', 'guest', 'booking', 'error', 'timeout', 'login', 'card', 'confirm', 'rate'];
  let out = '';
  while (out.length < chars) {
    out += words[Math.floor(Math.random() * words.length)] + ' ';
  }
  return out.trim();
}

export let options = {
  // override via env variables: VUS and DURATION passed to k6 CLI
};

export default function () {
  const payload = {
    hotelName: 'Load Test Hotel',
    contactName: 'Tester',
    contactEmail: 'tester@example.com',
    issueType: 'technical',
    description: randomText(800 + Math.floor(Math.random() * 1200)), // 800-2000 chars
    consent: 'on'
  };

  const params = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  // build multipart/form-data body using k6 http.file helper
  const fd = {
    hotelName: payload.hotelName,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    issueType: payload.issueType,
    description: payload.description,
    consent: 'on'
  };

  const res = http.post(URL, fd);
  check(res, { 'status was 201 or 200': (r) => r.status === 201 || r.status === 200 });
  sleep(1);
}
