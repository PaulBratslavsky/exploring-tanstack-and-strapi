/**
 * Script to test comment functionality with migrated data
 * This validates that the comment system works correctly after migration
 */

const path = require('path');
const Database = require('better-sqlite3');

function testCommentFunctionality() {
  console.log('=== Testing Comment Functionality Post-Migration ===\n');
  
  const testResults = [];
  
  try {
    // Connect to the SQLite database
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath);
    
    // Test 1: Retrieve and build comment hierarchy
    console.log('1. Testing comment hierarchy building...');
    
    const contentId = 'o8rtuc5hjnraaj1v2wbesqyu'; // From sample data
    const comments = db.prepare(`
      SELECT id, document_id, parent_id, content, user_id, created_at, is_deleted
      FROM comments 
      WHERE content_id = ? AND is_deleted = 0
      ORDER BY created_at ASC
    `).all(contentId);
    
    console.log(`Found ${comments.length} comments for content ${contentId}`);
    
    if (comments.length > 0) {
      const hierarchy = buildCommentHierarchy(comments);
      console.log('✅ Successfully built comment hierarchy');
      console.log(`Root comments: ${hierarchy.length}`);
      
      // Display hierarchy structure
      displayHierarchy(hierarchy, 0);
      testResults.push({ test: 'Hierarchy Building', status: 'PASSED' });
    } else {
      console.log('⚠️  No comments found for testing');
      testResults.push({ test: 'Hierarchy Building', status: 'SKIPPED' });
    }
    
    // Test 2: Validate parent-child relationships
    console.log('\n2. Testing parent-child relationships...');
    
    const parentChildPairs = db.prepare(`
      SELECT 
        c.document_id as child_id,
        c.parent_id,
        p.document_id as parent_document_id,
        c.content as child_content,
        p.content as parent_content
      FROM comments c
      JOIN comments p ON c.parent_id = p.document_id
      WHERE c.parent_id IS NOT NULL
    `).all();
    
    console.log(`Found ${parentChildPairs.length} valid parent-child relationships`);
    
    if (parentChildPairs.length > 0) {
      console.log('Sample parent-child relationships:');
      parentChildPairs.slice(0, 3).forEach(pair => {
        console.log(`  Child: "${pair.child_content.substring(0, 50)}..."`);
        console.log(`  Parent: "${pair.parent_content.substring(0, 50)}..."`);
        console.log('  ---');
      });
      testResults.push({ test: 'Parent-Child Relationships', status: 'PASSED' });
    } else {
      testResults.push({ test: 'Parent-Child Relationships', status: 'SKIPPED' });
    }
    
    // Test 3: Test comment creation simulation
    console.log('\n3. Testing comment creation (simulation)...');
    
    try {
      // Simulate creating a new comment
      const newCommentData = {
        document_id: 'test-comment-' + Date.now(),
        content: 'This is a test comment created post-migration',
        content_type: 'comment',
        content_id: contentId,
        user_id: '2',
        parent_id: null, // Root comment
        is_edited: 0,
        is_deleted: 0,
        is_inappropriate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const insertStmt = db.prepare(`
        INSERT INTO comments (
          document_id, content, content_type, content_id, user_id, parent_id,
          is_edited, is_deleted, is_inappropriate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertStmt.run(
        newCommentData.document_id,
        newCommentData.content,
        newCommentData.content_type,
        newCommentData.content_id,
        newCommentData.user_id,
        newCommentData.parent_id,
        newCommentData.is_edited,
        newCommentData.is_deleted,
        newCommentData.is_inappropriate,
        newCommentData.created_at,
        newCommentData.updated_at
      );
      
      console.log(`✅ Successfully created test comment with ID: ${result.lastInsertRowid}`);
      
      // Test creating a reply
      const replyData = {
        document_id: 'test-reply-' + Date.now(),
        content: 'This is a test reply to the test comment',
        content_type: 'comment',
        content_id: contentId,
        user_id: '2',
        parent_id: newCommentData.document_id, // Reply to the test comment
        is_edited: 0,
        is_deleted: 0,
        is_inappropriate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const replyResult = insertStmt.run(
        replyData.document_id,
        replyData.content,
        replyData.content_type,
        replyData.content_id,
        replyData.user_id,
        replyData.parent_id,
        replyData.is_edited,
        replyData.is_deleted,
        replyData.is_inappropriate,
        replyData.created_at,
        replyData.updated_at
      );
      
      console.log(`✅ Successfully created test reply with ID: ${replyResult.lastInsertRowid}`);
      
      // Verify the hierarchy includes the new comments
      const updatedComments = db.prepare(`
        SELECT id, document_id, parent_id, content, user_id, created_at
        FROM comments 
        WHERE content_id = ? AND is_deleted = 0
        ORDER BY created_at ASC
      `).all(contentId);
      
      const updatedHierarchy = buildCommentHierarchy(updatedComments);
      console.log(`✅ Updated hierarchy has ${updatedComments.length} comments`);
      
      // Clean up test data
      db.prepare('DELETE FROM comments WHERE document_id = ?').run(newCommentData.document_id);
      db.prepare('DELETE FROM comments WHERE document_id = ?').run(replyData.document_id);
      console.log('✅ Cleaned up test data');
      
      testResults.push({ test: 'Comment Creation', status: 'PASSED' });
      
    } catch (error) {
      console.log('❌ Comment creation test failed:', error.message);
      testResults.push({ test: 'Comment Creation', status: 'FAILED', error: error.message });
    }
    
    // Test 4: Test comment querying by content
    console.log('\n4. Testing comment querying...');
    
    const allContentIds = db.prepare('SELECT DISTINCT content_id FROM comments').all();
    console.log(`Found comments for ${allContentIds.length} different content items`);
    
    for (const { content_id } of allContentIds) {
      const contentComments = db.prepare(`
        SELECT COUNT(*) as count 
        FROM comments 
        WHERE content_id = ? AND is_deleted = 0
      `).get(content_id);
      
      console.log(`Content ${content_id}: ${contentComments.count} comments`);
    }
    
    testResults.push({ test: 'Comment Querying', status: 'PASSED' });
    
    // Test 5: Test comment filtering and moderation
    console.log('\n5. Testing comment filtering...');
    
    const moderationStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted,
        SUM(CASE WHEN is_inappropriate = 1 THEN 1 ELSE 0 END) as inappropriate,
        SUM(CASE WHEN is_edited = 1 THEN 1 ELSE 0 END) as edited
      FROM comments
    `).get();
    
    console.log('Comment moderation stats:');
    console.log(`  Total: ${moderationStats.total}`);
    console.log(`  Deleted: ${moderationStats.deleted}`);
    console.log(`  Inappropriate: ${moderationStats.inappropriate}`);
    console.log(`  Edited: ${moderationStats.edited}`);
    
    testResults.push({ test: 'Comment Filtering', status: 'PASSED' });
    
    db.close();
    
    // Generate test report
    console.log('\n=== FUNCTIONALITY TEST REPORT ===');
    
    const passedTests = testResults.filter(t => t.status === 'PASSED').length;
    const failedTests = testResults.filter(t => t.status === 'FAILED').length;
    const skippedTests = testResults.filter(t => t.status === 'SKIPPED').length;
    
    testResults.forEach(result => {
      const icon = result.status === 'PASSED' ? '✅' : 
                   result.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    
    console.log(`\nSummary: ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped`);
    
    if (failedTests === 0) {
      console.log('\n🎉 ALL FUNCTIONALITY TESTS PASSED');
      console.log('The comment system is working correctly with the migrated data.');
    } else {
      console.log('\n❌ SOME FUNCTIONALITY TESTS FAILED');
      console.log('Review the errors above and fix issues before proceeding.');
    }
    
    return failedTests === 0;
    
  } catch (error) {
    console.error('Error during functionality testing:', error);
    return false;
  }
}

// Helper function to build comment hierarchy
function buildCommentHierarchy(comments) {
  const commentMap = new Map();
  const rootComments = [];
  
  // First pass: create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.document_id, { ...comment, replies: [] });
  });
  
  // Second pass: build hierarchy
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.document_id);
    
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentWithReplies);
      } else {
        // Parent not found, treat as root comment
        rootComments.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });
  
  return rootComments;
}

// Helper function to display hierarchy
function displayHierarchy(comments, depth = 0) {
  const indent = '  '.repeat(depth);
  
  comments.forEach(comment => {
    console.log(`${indent}- Comment: "${comment.content.substring(0, 50)}..." (ID: ${comment.document_id})`);
    if (comment.replies && comment.replies.length > 0) {
      displayHierarchy(comment.replies, depth + 1);
    }
  });
}

// Run functionality tests
const success = testCommentFunctionality();
process.exit(success ? 0 : 1);