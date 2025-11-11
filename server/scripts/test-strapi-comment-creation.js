/**
 * Test script to debug Strapi comment creation
 */

'use strict';

async function testStrapiCommentCreation() {
  console.log('=== Testing Strapi Comment Creation ===\n');
  
  try {
    const Strapi = require('@strapi/strapi');
    const app = Strapi();
    const knex = app.db.connection;
    
    console.log('1. Testing comment service directly...');
    
    // Test data similar to what frontend sends
    const testCommentData = {
      content: 'Test comment from service',
      contentType: 'comment',
      contentId: 'o8rtuc5hjnraaj1v2wbesqyu', // Use existing content ID
      userId: '2'
    };
    
    console.log('Test data:', testCommentData);
    
    try {
      // Test the service method directly
      const result = await strapi.service('api::comment.comment').createComment(testCommentData);
      console.log('✅ Service method succeeded:', result);
      
      // Clean up
      if (result && result.id) {
        await strapi.entityService.delete('api::comment.comment', result.id);
        console.log('✅ Test comment cleaned up');
      }
      
    } catch (error) {
      console.log('❌ Service method failed:', error.message);
      console.log('Error details:', error);
    }
    
    console.log('\n2. Testing entity service directly...');
    
    try {
      // Test entity service directly
      const entityResult = await strapi.entityService.create('api::comment.comment', {
        data: testCommentData
      });
      console.log('✅ Entity service succeeded:', entityResult);
      
      // Clean up
      if (entityResult && entityResult.id) {
        await strapi.entityService.delete('api::comment.comment', entityResult.id);
        console.log('✅ Test comment cleaned up');
      }
      
    } catch (error) {
      console.log('❌ Entity service failed:', error.message);
      console.log('Error details:', error);
    }
    
    console.log('\n3. Testing with parent comment...');
    
    // Get an existing comment to use as parent
    const existingComment = await knex('comments')
      .where('content_id', 'o8rtuc5hjnraaj1v2wbesqyu')
      .whereNull('parent_id')
      .first();
    
    if (existingComment) {
      console.log('Using parent comment:', existingComment.document_id);
      
      const replyData = {
        content: 'Test reply from service',
        contentType: 'comment',
        contentId: 'o8rtuc5hjnraaj1v2wbesqyu',
        userId: '2',
        parentId: existingComment.document_id
      };
      
      try {
        const replyResult = await strapi.service('api::comment.comment').createComment(replyData);
        console.log('✅ Reply creation succeeded:', replyResult);
        
        // Clean up
        if (replyResult && replyResult.id) {
          await strapi.entityService.delete('api::comment.comment', replyResult.id);
          console.log('✅ Test reply cleaned up');
        }
        
      } catch (error) {
        console.log('❌ Reply creation failed:', error.message);
        console.log('Error details:', error);
      }
    } else {
      console.log('No existing comment found for reply test');
    }
    
    console.log('\n4. Testing validation edge cases...');
    
    // Test empty content
    try {
      await strapi.service('api::comment.comment').createComment({
        content: '',
        contentType: 'comment',
        contentId: 'o8rtuc5hjnraaj1v2wbesqyu',
        userId: '2'
      });
      console.log('❌ Empty content validation failed - should have thrown error');
    } catch (error) {
      console.log('✅ Empty content validation works:', error.message);
    }
    
    // Test missing contentType
    try {
      await strapi.service('api::comment.comment').createComment({
        content: 'Test content',
        contentId: 'o8rtuc5hjnraaj1v2wbesqyu',
        userId: '2'
      });
      console.log('❌ Missing contentType validation failed - should have thrown error');
    } catch (error) {
      console.log('✅ Missing contentType validation works:', error.message);
    }
    
    // Test invalid contentType
    try {
      await strapi.service('api::comment.comment').createComment({
        content: 'Test content',
        contentType: 'invalid',
        contentId: 'o8rtuc5hjnraaj1v2wbesqyu',
        userId: '2'
      });
      console.log('❌ Invalid contentType validation failed - should have thrown error');
    } catch (error) {
      console.log('✅ Invalid contentType validation works:', error.message);
    }
    
    await app.destroy();
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

testStrapiCommentCreation();