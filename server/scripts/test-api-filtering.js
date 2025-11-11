/**
 * Test script to simulate the exact API request the frontend makes
 */

const path = require('path');

function testAPIFiltering() {
  console.log('=== Testing API Filtering ===\n');
  
  console.log('The frontend makes this request:');
  console.log('GET /api/comments with filters:');
  console.log('  contentType: { $eq: "comment" }');
  console.log('  contentId: { $eq: "articleDocumentId" }');
  console.log('  isDeleted: { $eq: false }');
  
  console.log('\nTo test this manually, run:');
  console.log('curl "http://localhost:1337/api/comments?filters[contentType][$eq]=comment&filters[contentId][$eq]=o8rtuc5hjnraaj1v2wbesqyu&filters[isDeleted][$eq]=false"');
  
  console.log('\nOr test with a different contentId:');
  console.log('curl "http://localhost:1337/api/comments?filters[contentType][$eq]=comment&filters[contentId][$eq]=be9fsxd1j04vgqdsmgq6edsp&filters[isDeleted][$eq]=false"');
  
  console.log('\nExpected results:');
  console.log('- First request should return 3 comments');
  console.log('- Second request should return 0 comments');
  
  console.log('\nIf both requests return the same comments, then:');
  console.log('1. The controller is not detecting the filters correctly');
  console.log('2. The service method is not applying the filters');
  console.log('3. The entityService.findMany is not working with the filters');
  
  console.log('\nCheck the server logs for debug output when making these requests.');
}

testAPIFiltering();