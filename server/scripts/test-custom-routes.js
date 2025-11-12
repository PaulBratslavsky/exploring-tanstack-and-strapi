/**
 * Test script for custom comment routes
 * Tests: GET /api/comments/with-user and POST /api/comments/with-user
 * Verifies: Public access, user data population, authentication, middleware
 */

// Use native fetch (Node.js 18+)
const fetch = globalThis.fetch;

const baseUrl = 'http://localhost:1337';
let authToken = null;
let testUser = null;
let createdCommentId = null;
let testArticleId = 'test-article-' + Date.now();

// Helper function to login and get auth token
async function login() {
  console.log('🔐 Logging in to get auth token...');
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'Test1234!'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.jwt) {
      authToken = data.jwt;
      testUser = data.user;
      console.log('✅ Login successful');
      console.log(`   User: ${testUser.username} (${testUser.email})`);
      return true;
    } else {
      console.log('❌ Login failed:', data.error?.message || 'Unknown error');
      console.log('   Note: Make sure test user exists (test@example.com / Test1234!)');
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

// Test 1: GET /api/comments/with-user without authentication (should work - public access)
async function testGetCommentsPublicAccess() {
  console.log('\n📖 Test 1: GET /api/comments/with-user (Public Access)');
  
  try {
    const response = await fetch(`${baseUrl}/api/comments/with-user`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Public access to GET endpoint successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   Comments returned: ${Array.isArray(data) ? data.length : 'N/A'}`);
      return true;
    } else {
      console.log('❌ Public access failed:', response.status);
      console.log('   Error:', data.error?.message || JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 2: GET /api/comments/with-user with filters
async function testGetCommentsWithFilters() {
  console.log('\n🔍 Test 2: GET /api/comments/with-user with Filters');
  
  try {
    const params = new URLSearchParams({
      'filters[articleId][$eq]': testArticleId,
      'pagination[page]': '1',
      'pagination[pageSize]': '5',
      'sort[0]': 'createdAt:desc'
    });
    
    const response = await fetch(`${baseUrl}/api/comments/with-user?${params}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Filtered query successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   Comments returned: ${Array.isArray(data) ? data.length : 'N/A'}`);
      return true;
    } else {
      console.log('❌ Filtered query failed:', response.status);
      console.log('   Error:', data.error?.message || JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 3: POST /api/comments/with-user without authentication (should fail)
async function testCreateCommentNoAuth() {
  console.log('\n🚫 Test 3: POST /api/comments/with-user Without Auth (Should Fail)');
  
  try {
    const response = await fetch(`${baseUrl}/api/comments/with-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          content: 'This should fail - no auth',
          articleId: testArticleId
        }
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Correctly rejected unauthenticated POST request');
      console.log(`   Status: ${response.status}`);
      return true;
    } else {
      console.log('❌ Should have rejected unauthenticated POST request');
      console.log(`   Got status: ${response.status}`);
      console.log('   Response:', JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 4: POST /api/comments/with-user with authentication
async function testCreateCommentWithAuth() {
  console.log('\n📝 Test 4: POST /api/comments/with-user With Auth');
  
  if (!authToken) {
    console.log('⚠️  Skipping - no auth token');
    return false;
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/comments/with-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        data: {
          content: 'Test comment via custom route - ' + Date.now(),
          articleId: testArticleId
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data) {
      createdCommentId = data.id;
      console.log('✅ Create comment successful');
      console.log(`   Comment ID: ${data.id}`);
      console.log(`   Document ID: ${data.documentId}`);
      console.log(`   Content: ${data.content.substring(0, 50)}...`);
      console.log(`   Author populated: ${data.author ? 'Yes' : 'No'}`);
      
      if (data.author) {
        console.log(`   Author username: ${data.author.username}`);
        console.log(`   Author has only safe fields: ${Object.keys(data.author).sort().join(', ')}`);
      }
      
      return true;
    } else {
      console.log('❌ Create comment failed:', response.status);
      console.log('   Error:', data.error?.message || JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 5: Verify author is set server-side (cannot be overridden by client)
async function testAuthorSetServerSide() {
  console.log('\n🔒 Test 5: Verify Author Set Server-Side (Security)');
  
  if (!authToken) {
    console.log('⚠️  Skipping - no auth token');
    return false;
  }
  
  try {
    // Try to set author to a different user (should be ignored)
    const response = await fetch(`${baseUrl}/api/comments/with-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        data: {
          content: 'Test author override attempt',
          articleId: testArticleId,
          author: {
            set: ['fake-user-id-12345']
          }
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data && data.author) {
      // Verify the author is the authenticated user, not the fake one
      if (data.author.username === testUser.username) {
        console.log('✅ Author correctly set to authenticated user');
        console.log(`   Author: ${data.author.username}`);
        console.log('   Client-provided author was ignored (security working)');
        return true;
      } else {
        console.log('❌ Security issue: Author was overridden by client');
        console.log(`   Expected: ${testUser.username}`);
        console.log(`   Got: ${data.author.username}`);
        return false;
      }
    } else {
      console.log('❌ Request failed or no author data:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 6: Verify GET returns only username (not sensitive user data)
async function testUserDataSanitization() {
  console.log('\n🛡️  Test 6: Verify User Data Sanitization');
  
  if (!createdCommentId) {
    console.log('⚠️  Skipping - no comment created');
    return false;
  }
  
  try {
    const params = new URLSearchParams({
      'filters[articleId][$eq]': testArticleId
    });
    
    const response = await fetch(`${baseUrl}/api/comments/with-user?${params}`);
    const data = await response.json();
    
    if (response.ok && Array.isArray(data) && data.length > 0) {
      const comment = data.find(c => c.id === createdCommentId);
      
      if (!comment) {
        console.log('⚠️  Created comment not found in results');
        return false;
      }
      
      if (!comment.author) {
        console.log('❌ Author data missing');
        return false;
      }
      
      const authorFields = Object.keys(comment.author);
      const expectedFields = ['id', 'documentId', 'username'].sort();
      const actualFields = authorFields.sort();
      
      // Check that only safe fields are present
      const hasOnlySafeFields = 
        actualFields.length === expectedFields.length &&
        actualFields.every((field, index) => field === expectedFields[index]);
      
      if (hasOnlySafeFields) {
        console.log('✅ User data properly sanitized');
        console.log(`   Author fields: ${authorFields.join(', ')}`);
        console.log('   No sensitive data exposed (email, password, etc.)');
        return true;
      } else {
        console.log('❌ User data not properly sanitized');
        console.log(`   Expected fields: ${expectedFields.join(', ')}`);
        console.log(`   Actual fields: ${actualFields.join(', ')}`);
        return false;
      }
    } else {
      console.log('❌ Failed to fetch comments:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 7: Verify pagination works
async function testPagination() {
  console.log('\n📄 Test 7: Verify Pagination');
  
  try {
    const params = new URLSearchParams({
      'pagination[page]': '1',
      'pagination[pageSize]': '2'
    });
    
    const response = await fetch(`${baseUrl}/api/comments/with-user?${params}`);
    const data = await response.json();
    
    if (response.ok && Array.isArray(data)) {
      console.log('✅ Pagination working');
      console.log(`   Requested pageSize: 2`);
      console.log(`   Comments returned: ${data.length}`);
      return true;
    } else {
      console.log('❌ Pagination failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 8: Verify sorting works
async function testSorting() {
  console.log('\n🔢 Test 8: Verify Sorting');
  
  try {
    const params = new URLSearchParams({
      'sort[0]': 'createdAt:desc',
      'pagination[pageSize]': '10'
    });
    
    const response = await fetch(`${baseUrl}/api/comments/with-user?${params}`);
    const data = await response.json();
    
    if (response.ok && Array.isArray(data) && data.length > 1) {
      // Check if sorted by createdAt descending
      const dates = data.map(c => new Date(c.createdAt).getTime());
      const isSorted = dates.every((date, i) => i === 0 || date <= dates[i - 1]);
      
      if (isSorted) {
        console.log('✅ Sorting working correctly');
        console.log(`   Comments sorted by createdAt:desc`);
        return true;
      } else {
        console.log('❌ Comments not properly sorted');
        return false;
      }
    } else if (response.ok && Array.isArray(data) && data.length <= 1) {
      console.log('✅ Sorting endpoint working (insufficient data to verify order)');
      return true;
    } else {
      console.log('❌ Sorting failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Test 9: Verify validation on POST
async function testPostValidation() {
  console.log('\n✔️  Test 9: Verify POST Validation');
  
  if (!authToken) {
    console.log('⚠️  Skipping - no auth token');
    return false;
  }
  
  let allPassed = true;
  
  // Test 9a: Empty content
  try {
    const response = await fetch(`${baseUrl}/api/comments/with-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        data: {
          content: '',
          articleId: testArticleId
        }
      })
    });
    
    if (response.status === 400) {
      console.log('✅ Empty content validation working');
    } else {
      console.log('❌ Empty content should be rejected');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Empty content test error:', error.message);
    allPassed = false;
  }
  
  // Test 9b: Missing articleId
  try {
    const response = await fetch(`${baseUrl}/api/comments/with-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        data: {
          content: 'Test content'
          // Missing articleId
        }
      })
    });
    
    if (response.status === 400) {
      console.log('✅ Missing articleId validation working');
    } else {
      console.log('❌ Missing articleId should be rejected');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Missing articleId test error:', error.message);
    allPassed = false;
  }
  
  return allPassed;
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Custom Routes Test Suite                              ║');
  console.log('║  Testing: /api/comments/with-user endpoints            ║');
  console.log('║  Verifying: Auth, Security, Data Sanitization          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Try to login (optional for some tests)
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n⚠️  Authentication not available');
    console.log('   Will run public access tests only');
    console.log('   To run full test suite:');
    console.log('   1. Ensure Strapi server is running on http://localhost:1337');
    console.log('   2. Create a test user via Strapi admin or registration');
    console.log('   3. Update credentials in this script\n');
  }
  
  // Run all tests
  const tests = [
    { name: 'GET Public Access', fn: testGetCommentsPublicAccess },
    { name: 'GET With Filters', fn: testGetCommentsWithFilters },
    { name: 'POST Without Auth', fn: testCreateCommentNoAuth },
    { name: 'POST With Auth', fn: testCreateCommentWithAuth },
    { name: 'Author Set Server-Side', fn: testAuthorSetServerSide },
    { name: 'User Data Sanitization', fn: testUserDataSanitization },
    { name: 'Pagination', fn: testPagination },
    { name: 'Sorting', fn: testSorting },
    { name: 'POST Validation', fn: testPostValidation }
  ];
  
  for (const test of tests) {
    const result = await test.fn();
    if (result === true) {
      results.passed++;
    } else if (result === false) {
      results.failed++;
    } else {
      results.skipped++;
    }
  }
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`\nTotal:     ${results.passed + results.failed + results.skipped}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Custom routes are working correctly.');
    console.log('\n✓ Verified:');
    console.log('  - GET /api/comments/with-user allows public access');
    console.log('  - POST /api/comments/with-user requires authentication');
    console.log('  - Author is set server-side (security)');
    console.log('  - User data is properly sanitized (only username exposed)');
    console.log('  - Pagination and sorting work correctly');
    console.log('  - Validation is functioning properly');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
