#!/usr/bin/env tsx
/**
 * Smoke Tests
 * Quick validation that critical endpoints are working after deployment
 */

interface SmokeTest {
  name: string;
  url: string;
  method?: string;
  expectedStatus?: number;
  expectedBody?: string | RegExp;
  timeout?: number;
}

const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:3000';

const tests: SmokeTest[] = [
  {
    name: 'Health Check',
    url: '/api/health',
    expectedStatus: 200,
    expectedBody: /"status"\s*:\s*"ok"/,
  },
  {
    name: 'Homepage',
    url: '/',
    expectedStatus: 200,
  },
  {
    name: 'Login Page',
    url: '/login',
    expectedStatus: 200,
  },
  {
    name: 'Register Page',
    url: '/register',
    expectedStatus: 200,
  },
  {
    name: 'Pricing Page',
    url: '/pricing',
    expectedStatus: 200,
  },
  {
    name: 'Dashboard (Unauthenticated)',
    url: '/dashboard',
    expectedStatus: 307, // Redirect to login
  },
];

async function runSmokeTest(test: SmokeTest): Promise<boolean> {
  const url = `${BASE_URL}${test.url}`;
  const method = test.method || 'GET';
  const timeout = test.timeout || 5000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: 'manual',
    });

    clearTimeout(timeoutId);

    // Check status code
    if (test.expectedStatus && response.status !== test.expectedStatus) {
      console.error(`  ❌ Expected status ${test.expectedStatus}, got ${response.status}`);
      return false;
    }

    // Check body if specified
    if (test.expectedBody) {
      const body = await response.text();
      const pattern = typeof test.expectedBody === 'string' 
        ? new RegExp(test.expectedBody) 
        : test.expectedBody;
      
      if (!pattern.test(body)) {
        console.error(`  ❌ Response body doesn't match expected pattern`);
        return false;
      }
    }

    console.log(`  ✅ ${test.name}`);
    return true;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`  ❌ ${test.name} - TIMEOUT (>${timeout}ms)`);
    } else {
      console.error(`  ❌ ${test.name} - ${error.message}`);
    }
    return false;
  }
}

async function runAllTests(): Promise<boolean> {
  console.log(`\n🧪 Running smoke tests against: ${BASE_URL}\n`);
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await runSmokeTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error(`\n❌ Smoke tests FAILED`);
    return false;
  }

  console.log(`\n✅ All smoke tests PASSED!`);
  return true;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
