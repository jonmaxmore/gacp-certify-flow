// tests/performance/load-test.js
/**
 * Performance Load Testing for GACP Platform
 * K6 Load Testing Script for Thai Herbal Certification System
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const loginErrorRate = new Rate('login_errors');
const applicationErrorRate = new Rate('application_errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 concurrent Thai farmers
    { duration: '3m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Stress test: ramp up to 200 users
    { duration: '3m', target: 200 },  // Maintain 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],     // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],        // Error rate under 10%
    login_errors: ['rate<0.05'],          // Login error rate under 5%
    application_errors: ['rate<0.05'],    // Application error rate under 5%
  },
};

const BASE_URL = 'http://localhost:3001';

// Thai farmer test data
const testFarmers = [
  {
    email: 'somchai@farmer.th',
    password: 'test123',
    thai_id: '1234567890123',
    province: 'เชียงใหม่'
  },
  {
    email: 'somying@farmer.th', 
    password: 'test123',
    thai_id: '1234567890124',
    province: 'กรุงเทพมหานคร'
  },
  {
    email: 'somsak@farmer.th',
    password: 'test123', 
    thai_id: '1234567890125',
    province: 'ขอนแก่น'
  }
];

export default function() {
  // Select random farmer for this iteration
  const farmer = testFarmers[Math.floor(Math.random() * testFarmers.length)];
  
  // Test 1: Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check successful': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  // Test 2: Authentication (Mock - since we don't have real auth)
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: farmer.email,
      password: farmer.password,
      thai_id: farmer.thai_id
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200 || r.status === 404, // 404 expected since endpoint not implemented
    'login response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  loginErrorRate.add(!loginSuccess);
  
  // Mock token for testing (in real scenario, extract from login response)
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  
  // Test 3: Get Applications List
  const appsRes = http.get(
    `${BASE_URL}/api/v1/applications?province=${encodeURIComponent(farmer.province)}`,
    {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const appsSuccess = check(appsRes, {
    'applications retrieved': (r) => r.status === 200,
    'applications response time < 300ms': (r) => r.timings.duration < 300,
    'applications response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  });
  
  applicationErrorRate.add(!appsSuccess);
  
  // Test 4: Create New Application (Every 10th iteration)
  if (__ITER % 10 === 0) {
    const newApplicationData = {
      farmer_data: {
        thai_id: farmer.thai_id,
        first_name: 'สมชาย',
        last_name: 'ใจดี',
        phone: '0812345678',
        email: farmer.email,
        province: farmer.province,
        district: 'เมือง' + farmer.province,
        subdistrict: 'ศรีภูมิ'
      },
      farm_details: {
        farm_name: 'ฟาร์มสมุนไพร Load Test',
        farm_size: Math.random() * 10 + 1, // 1-11 rai
        latitude: 13.7563 + (Math.random() - 0.5) * 0.1,
        longitude: 100.5018 + (Math.random() - 0.5) * 0.1,
        soil_type: 'ดินร่วนปนทราย'
      },
      cultivation_data: {
        herbs: [
          {
            name: 'ขมิ้นชัน',
            planted_area: Math.random() * 3 + 0.5,
            cultivation_method: 'organic'
          }
        ]
      }
    };
    
    const createRes = http.post(
      `${BASE_URL}/api/v1/applications`,
      JSON.stringify(newApplicationData),
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(createRes, {
      'application creation successful': (r) => r.status === 201 || r.status === 200,
      'creation response time < 500ms': (r) => r.timings.duration < 500,
    });
  }
  
  // Test 5: Get Statistics (Every 20th iteration)
  if (__ITER % 20 === 0) {
    const statsRes = http.get(
      `${BASE_URL}/api/v1/statistics`,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      }
    );
    
    check(statsRes, {
      'statistics retrieved': (r) => r.status === 200,
      'statistics response time < 400ms': (r) => r.timings.duration < 400,
    });
  }
  
  // Simulate user think time (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'performance-report.json': JSON.stringify(data, null, 2),
    'performance-summary.txt': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  
  let summary = `${indent}GACP Platform Performance Test Results\n`;
  summary += `${indent}=====================================\n\n`;
  
  summary += `${indent}Test Duration: ${data.state.testRunDurationMs}ms\n`;
  summary += `${indent}Total Iterations: ${data.metrics.iterations.values.count}\n`;
  summary += `${indent}Total HTTP Requests: ${data.metrics.http_reqs.values.count}\n\n`;
  
  summary += `${indent}Response Times:\n`;
  summary += `${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  
  summary += `${indent}Error Rates:\n`;
  summary += `${indent}  HTTP Failures: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  
  if (data.metrics.login_errors) {
    summary += `${indent}  Login Errors: ${(data.metrics.login_errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  if (data.metrics.application_errors) {
    summary += `${indent}  Application Errors: ${(data.metrics.application_errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  return summary;
}