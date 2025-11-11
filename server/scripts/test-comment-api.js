/**
 * Test script to make HTTP requests to the comment API
 */

const fetch = require('node-fetch');

async function testCommentAPI() {
  console.log('=== Testing Comment API ===\n');
  
  const baseUrl = 'http://localhost:1337';
  
  // First, let's try to get existing comments to see if the API is working
  console.log('1. Testing GET /api/comments...');
  
  try {
    const response = await fetch(`${baseUrl}/api/comments`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ GET comments successful');
      console.log(`Found ${data.data?.length || 0} comments`);
      if (data.data && data.data.length > 0) {
        console.log('Sample comment:', data.data[0]);
      }
    } else {
      console.log('❌ GET comments failed:', response.status, data);
    }
  } catch (error) {
    console.log('❌ GET comments error:', error.message);
  }
  
  // Test with specific filters
  console.log('\n2. Testing GET /api/comments with filters...');
  
  try {
    const filterUrl = `${baseUrl}/api/comments?filters[contentType][$eq]=comment&filters[contentId][$eq]=o8rtuc5hjnraaj1v2wbesqyu`;
    const response = await fetch(filterUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ GET comments with filters successful');
      console.log(`Found ${data.data?.length || 0} comments for specific content`);
    } else {
      console.log('❌ GET comments with filters failed:', response.status, data);
    }
  } catch (error) {
    console.log('❌ GET comments with filters error:', error.message);
  }
  
  // Test POST without authentication (should fail)
  console.log('\n3. Testing POST /api/comments without auth (should fail)...');
  
  try {
    const response = await fetch(`${baseUrl}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          content: 'Test comment without auth',
          contentType: 'comment',
          contentId: 'o8rtuc5hjnraaj1v2wbesqyu'
        }
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ POST without auth correctly rejected:', data.error?.message);
    } else {
      console.log('❌ POST without auth should have failed with 401, got:', response.status, data);
    }
  } catch (error) {
    console.log('❌ POST without auth error:', error.message);
  }
  
  console.log('\n=== API Test Complete ===');
  console.log('Note: To test authenticated requests, you need a valid JWT token');
}

testCommentAPI();