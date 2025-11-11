/**
 * Script to fix cross-content reply issues
 * Comments should only reply to other comments within the same content item
 */

const path = require('path');
const Database = require('better-sqlite3');

function fixCrossContentReplies() {
  console.log('=== Fixing Cross-Content Reply Issues ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath);
    
    // 1. Find comments that have parent_id pointing to comments in different content
    console.log('1. Identifying cross-content reply issues...');
    
    const crossContentReplies = db.prepare(`
      SELECT 
        c.id as comment_id,
        c.document_id as comment_document_id,
        c.content_id as comment_content_id,
        c.parent_id,
        p.content_id as parent_content_id,
        c.content as comment_content,
        p.content as parent_content
      FROM comments c
      JOIN comments p ON c.parent_id = p.document_id
      WHERE c.content_id != p.content_id
    `).all();
    
    console.log(`Found ${crossContentReplies.length} cross-content reply issues:`);
    
    crossContentReplies.forEach(issue => {
      console.log(`  Comment ${issue.comment_id} (content: ${issue.comment_content_id})`);
      console.log(`    └─ Incorrectly replies to comment in content: ${issue.parent_content_id}`);
      console.log(`    └─ Comment: "${issue.comment_content.substring(0, 50)}..."`);
      console.log('');
    });
    
    if (crossContentReplies.length === 0) {
      console.log('✅ No cross-content reply issues found!');
      db.close();
      return true;
    }
    
    // 2. Fix the issues by setting parent_id to null (make them root comments)
    console.log('2. Fixing cross-content reply issues...');
    
    const fixStmt = db.prepare('UPDATE comments SET parent_id = NULL WHERE id = ?');
    
    let fixedCount = 0;
    for (const issue of crossContentReplies) {
      try {
        fixStmt.run(issue.comment_id);
        console.log(`✅ Fixed comment ${issue.comment_id} - converted to root comment`);
        fixedCount++;
      } catch (error) {
        console.log(`❌ Failed to fix comment ${issue.comment_id}:`, error.message);
      }
    }
    
    console.log(`\nFixed ${fixedCount} out of ${crossContentReplies.length} issues`);
    
    // 3. Verify the fix
    console.log('\n3. Verifying fixes...');
    
    const remainingIssues = db.prepare(`
      SELECT COUNT(*) as count
      FROM comments c
      JOIN comments p ON c.parent_id = p.document_id
      WHERE c.content_id != p.content_id
    `).get();
    
    if (remainingIssues.count === 0) {
      console.log('✅ All cross-content reply issues have been resolved!');
    } else {
      console.log(`❌ ${remainingIssues.count} issues remain unresolved`);
    }
    
    // 4. Show updated comment structure
    console.log('\n4. Updated comment structure by content:');
    
    const contentGroups = db.prepare(`
      SELECT content_id, COUNT(*) as comment_count
      FROM comments 
      WHERE is_deleted = 0
      GROUP BY content_id
      ORDER BY comment_count DESC
    `).all();
    
    contentGroups.forEach(group => {
      console.log(`\nContent ID: ${group.content_id} (${group.comment_count} comments)`);
      
      const commentsInGroup = db.prepare(`
        SELECT document_id, parent_id, SUBSTR(content, 1, 40) as preview
        FROM comments 
        WHERE content_id = ? AND is_deleted = 0
        ORDER BY created_at ASC
      `).all(group.content_id);
      
      // Build and display hierarchy
      const hierarchy = buildCommentHierarchy(commentsInGroup);
      displayHierarchy(hierarchy, 1);
    });
    
    // 5. Create validation to prevent future issues
    console.log('\n5. Creating validation trigger to prevent future cross-content replies...');
    
    try {
      // Drop existing trigger if it exists
      db.prepare('DROP TRIGGER IF EXISTS prevent_cross_content_replies').run();
      
      // Create trigger to prevent cross-content replies
      db.prepare(`
        CREATE TRIGGER prevent_cross_content_replies
        BEFORE INSERT ON comments
        WHEN NEW.parent_id IS NOT NULL
        BEGIN
          SELECT CASE
            WHEN (
              SELECT content_id FROM comments 
              WHERE document_id = NEW.parent_id
            ) != NEW.content_id
            THEN RAISE(ABORT, 'Cannot reply to comment from different content item')
          END;
        END
      `).run();
      
      console.log('✅ Created database trigger to prevent future cross-content replies');
      
    } catch (error) {
      console.log('⚠️  Could not create validation trigger:', error.message);
    }
    
    db.close();
    
    console.log('\n=== CROSS-CONTENT REPLY FIX COMPLETE ===');
    console.log('Comments are now properly isolated by content item.');
    
    return remainingIssues.count === 0;
    
  } catch (error) {
    console.error('Error fixing cross-content replies:', error);
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
    console.log(`${indent}├─ ${comment.document_id}: "${comment.preview}..."`);
    if (comment.replies && comment.replies.length > 0) {
      displayHierarchy(comment.replies, depth + 1);
    }
  });
}

// Run the fix
const success = fixCrossContentReplies();
process.exit(success ? 0 : 1);