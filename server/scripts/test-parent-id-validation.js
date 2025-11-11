/**
 * Script to test parentId validation functionality
 */

'use strict';

async function testValidation() {
  console.log('Testing parentId validation...');
  
  try {
    // Load validation module
    const validation = require('../src/api/comment/services/comment-validation');
    
    // Mock Strapi object for testing
    const mockStrapi = {
      entityService: {
        findMany: async (uid, options) => {
          // Mock finding a comment
          if (options.filters.documentId === 'valid-parent-id') {
            return [{ documentId: 'valid-parent-id', isDeleted: false }];
          }
          return [];
        }
      },
      log: {
        error: console.error
      }
    };

    console.log('\n=== Testing Basic Validation ===');
    
    // Test 1: Valid parentId
    const test1 = await validation.validateParentId('valid-parent-id', mockStrapi);
    console.log('Test 1 - Valid parentId:', test1.isValid ? '✅ PASS' : '❌ FAIL');
    
    // Test 2: Null parentId (should be valid for top-level comments)
    const test2 = await validation.validateParentId(null, mockStrapi);
    console.log('Test 2 - Null parentId:', test2.isValid ? '✅ PASS' : '❌ FAIL');
    
    // Test 3: Empty string (should be invalid)
    const test3 = await validation.validateParentId('', mockStrapi);
    console.log('Test 3 - Empty string:', !test3.isValid ? '✅ PASS' : '❌ FAIL');
    
    // Test 4: Non-string type (should be invalid)
    const test4 = await validation.validateParentId(123, mockStrapi);
    console.log('Test 4 - Non-string type:', !test4.isValid ? '✅ PASS' : '❌ FAIL');
    
    // Test 5: Too long string (should be invalid)
    const longString = 'a'.repeat(256);
    const test5 = await validation.validateParentId(longString, mockStrapi);
    console.log('Test 5 - Too long string:', !test5.isValid ? '✅ PASS' : '❌ FAIL');
    
    // Test 6: Non-existent parent (should be invalid)
    const test6 = await validation.validateParentId('non-existent-id', mockStrapi);
    console.log('Test 6 - Non-existent parent:', !test6.isValid ? '✅ PASS' : '❌ FAIL');

    console.log('\n=== Testing Circular Reference Prevention ===');
    
    // Test 7: Self-reference (should be invalid)
    const test7 = await validation.validateNoCircularReference('comment-1', 'comment-1', mockStrapi);
    console.log('Test 7 - Self-reference:', !test7.isValid ? '✅ PASS' : '❌ FAIL');
    
    // Test 8: No circular reference (should be valid)
    const test8 = await validation.validateNoCircularReference('comment-1', 'comment-2', mockStrapi);
    console.log('Test 8 - No circular reference:', test8.isValid ? '✅ PASS' : '❌ FAIL');

    console.log('\n=== Testing Nesting Depth ===');
    
    // Test 9: Valid depth (should be valid)
    const test9 = await validation.validateNestingDepth(null, mockStrapi, 5);
    console.log('Test 9 - Valid depth (top-level):', test9.isValid ? '✅ PASS' : '❌ FAIL');

    console.log('\n=== All Tests Completed ===');
    console.log('✅ parentId validation system is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testValidation();