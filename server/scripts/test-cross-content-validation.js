/**
 * Test script to verify that cross-content reply validation is working
 */

const path = require('path');
const Database = require('better-sqlite3');

function testCrossContentValidation() {
  console.log('=== Testing Cross-Content Reply Validation ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath);
    
    // 1. Test database trigger validation
    console.log('1. Testing database trigger validation...');
    
    // Get two different content IDs
    const contentIds = db.prepare('SELECT DISTINCT content_id FROM comments LIMIT 2').all();
    
    if (contentIds.length < 2) {
      console.log('⚠️  Need at least 2 different content items to test cross-content validation');
      db.close();
      return true;
    }
    
    const content1 = contentIds[0].content_id;
    const content2 = contentIds[1].content_id;
    
    console.log(`Content 1: ${content1}`);
    console.log(`Content 2: ${content2}`);
    
    // Get a comment from content1 to use as parent
    const parentComment = db.prepare('SELECT document_id FROM comments WHERE content_id = ? LIMIT 1').get(content1);
    
    if (!parentComment) {
      console.log('⚠️  No comments found in content1 for testing');
      db.close();
      return true;
    }
    
    console.log(`Using parent comment: ${parentComment.document_id}`);
    
    // 2. Try to create a cross-content reply (should fail)
    console.log('\n2. Attempting to create cross-content reply (should fail)...');
    
    try {
      const insertStmt = db.prepare(`
        INSERT INTO comments (
          document_id, content, content_type, content_id, user_id, parent_id,
          is_edited, is_deleted, is_inappropriate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const testCommentData = {
        document_id: 'test-cross-content-' + Date.now(),
        content: 'This should fail - cross content reply',
        content_type: 'comment',
        content_id: content2, // Different content
        user_id: '2',
        parent_id: parentComment.document_id, // Parent from different content
        is_edited: 0,
        is_deleted: 0,
        is_inappropriate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      insertStmt.run(
        testCommentData.document_id,
        testCommentData.content,
        testCommentData.content_type,
        testCommentData.content_id,
        testCommentData.user_id,
        testCommentData.parent_id,
        testCommentData.is_edited,
        testCommentData.is_deleted,
        testCommentData.is_inappropriate,
        testCommentData.created_at,
        testCommentData.updated_at
      );
      
      console.log('❌ VALIDATION FAILED: Cross-content reply was allowed!');
      
      // Clean up the invalid comment
      db.prepare('DELETE FROM comments WHERE document_id = ?').run(testCommentData.document_id);
      
      return false;
      
    } catch (error) {
      if (error.message.includes('Cannot reply to comment from different content item')) {
        console.log('✅ Database trigger correctly prevented cross-content reply');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
        return false;
      }
    }
    
    // 3. Test valid same-content reply (should succeed)
    console.log('\n3. Testing valid same-content reply (should succeed)...');
    
    try {
      const insertStmt = db.prepare(`
        INSERT INTO comments (
          document_id, content, content_type, content_id, user_id, parent_id,
          is_edited, is_deleted, is_inappropriate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const validCommentData = {
        document_id: 'test-valid-reply-' + Date.now(),
        content: 'This should succeed - same content reply',
        content_type: 'comment',
        content_id: content1, // Same content as parent
        user_id: '2',
        parent_id: parentComment.document_id, // Parent from same content
        is_edited: 0,
        is_deleted: 0,
        is_inappropriate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const result = insertStmt.run(
        validCommentData.document_id,
        validCommentData.content,
        validCommentData.content_type,
        validCommentData.content_id,
        validCommentData.user_id,
        validCommentData.parent_id,
        validCommentData.is_edited,
        validCommentData.is_deleted,
        validCommentData.is_inappropriate,
        validCommentData.created_at,
        validCommentData.updated_at
      );
      
      console.log(`✅ Valid same-content reply created successfully (ID: ${result.lastInsertRowid})`);
      
      // Clean up the test comment
      db.prepare('DELETE FROM comments WHERE document_id = ?').run(validCommentData.document_id);
      console.log('✅ Test comment cleaned up');
      
    } catch (error) {
      console.log('❌ Valid same-content reply failed:', error.message);
      return false;
    }
    
    // 4. Verify current data integrity
    console.log('\n4. Verifying current data integrity...');
    
    const crossContentIssues = db.prepare(`
      SELECT COUNT(*) as count
      FROM comments c
      JOIN comments p ON c.parent_id = p.document_id
      WHERE c.content_id != p.content_id
    `).get();
    
    if (crossContentIssues.count === 0) {
      console.log('✅ No cross-content reply issues in current data');
    } else {
      console.log(`❌ Found ${crossContentIssues.count} cross-content reply issues`);
      return false;
    }
    
    // 5. Show final comment structure
    console.log('\n5. Final comment structure verification:');
    
    const contentGroups = db.prepare(`
      SELECT content_id, COUNT(*) as comment_count,
             COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as reply_count
      FROM comments 
      WHERE is_deleted = 0
      GROUP BY content_id
      ORDER BY comment_count DESC
    `).all();
    
    contentGroups.forEach(group => {
      console.log(`Content ${group.content_id}: ${group.comment_count} comments (${group.reply_count} replies)`);
    });
    
    db.close();
    
    console.log('\n=== CROSS-CONTENT VALIDATION TEST RESULTS ===');
    console.log('✅ Database trigger prevents cross-content replies');
    console.log('✅ Valid same-content replies work correctly');
    console.log('✅ No cross-content issues in current data');
    console.log('✅ Comments are properly isolated by content item');
    
    return true;
    
  } catch (error) {
    console.error('Error testing cross-content validation:', error);
    return false;
  }
}

// Run the test
const success = testCrossContentValidation();
process.exit(success ? 0 : 1);