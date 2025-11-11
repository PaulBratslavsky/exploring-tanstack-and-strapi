/**
 * Script to verify data integrity after comment schema migration
 * This validates that all comment relationships are preserved correctly
 */

const path = require('path');
const Database = require('better-sqlite3');

function verifyMigrationIntegrity() {
  console.log('=== Comment Migration Data Integrity Verification ===\n');
  
  const errors = [];
  const warnings = [];
  const results = {};
  
  try {
    // Connect to the SQLite database
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath, { readonly: true });
    
    // 1. Basic table structure validation
    console.log('1. Validating table structure...');
    const columns = db.prepare("PRAGMA table_info(comments)").all();
    const columnNames = columns.map(col => col.name);
    
    const requiredColumns = ['id', 'document_id', 'parent_id', 'content_type', 'content_id', 'user_id'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('✅ All required columns present');
    }
    
    // 2. Count total comments
    console.log('\n2. Analyzing comment data...');
    const totalComments = db.prepare("SELECT COUNT(*) as count FROM comments").get();
    results.totalComments = totalComments.count;
    console.log(`Total comments: ${totalComments.count}`);
    
    // 3. Validate parentId references
    console.log('\n3. Validating parentId references...');
    const commentsWithParentId = db.prepare("SELECT COUNT(*) as count FROM comments WHERE parent_id IS NOT NULL").get();
    results.commentsWithParentId = commentsWithParentId.count;
    console.log(`Comments with parentId: ${commentsWithParentId.count}`);
    
    // Check for invalid parentId references (parentId that doesn't exist as documentId)
    const invalidParentRefs = db.prepare(`
      SELECT c1.id, c1.document_id, c1.parent_id 
      FROM comments c1 
      WHERE c1.parent_id IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 FROM comments c2 WHERE c2.document_id = c1.parent_id
      )
    `).all();
    
    if (invalidParentRefs.length > 0) {
      errors.push(`Found ${invalidParentRefs.length} comments with invalid parentId references`);
      console.log('❌ Invalid parentId references found:', invalidParentRefs);
    } else {
      console.log('✅ All parentId references are valid');
    }
    
    // 4. Check for circular references
    console.log('\n4. Checking for circular references...');
    const circularRefs = [];
    
    // Get all comments with parentId
    const commentsWithParents = db.prepare("SELECT document_id, parent_id FROM comments WHERE parent_id IS NOT NULL").all();
    
    for (const comment of commentsWithParents) {
      const visited = new Set();
      let current = comment.parent_id;
      let depth = 0;
      
      while (current && depth < 10) { // Max depth check to prevent infinite loops
        if (visited.has(current)) {
          circularRefs.push({
            startComment: comment.document_id,
            circularPath: Array.from(visited)
          });
          break;
        }
        
        visited.add(current);
        
        const parent = db.prepare("SELECT parent_id FROM comments WHERE document_id = ?").get(current);
        current = parent ? parent.parent_id : null;
        depth++;
      }
    }
    
    if (circularRefs.length > 0) {
      errors.push(`Found ${circularRefs.length} circular references`);
      console.log('❌ Circular references found:', circularRefs);
    } else {
      console.log('✅ No circular references detected');
    }
    
    // 5. Validate comment hierarchy depth
    console.log('\n5. Analyzing comment hierarchy depth...');
    const maxDepth = 5; // Reasonable maximum nesting depth
    const deepComments = [];
    
    for (const comment of commentsWithParents) {
      let current = comment.parent_id;
      let depth = 1;
      
      while (current && depth <= maxDepth) {
        const parent = db.prepare("SELECT parent_id FROM comments WHERE document_id = ?").get(current);
        if (!parent) break;
        
        current = parent.parent_id;
        depth++;
      }
      
      if (depth > maxDepth) {
        deepComments.push({
          commentId: comment.document_id,
          depth: depth
        });
      }
    }
    
    if (deepComments.length > 0) {
      warnings.push(`Found ${deepComments.length} comments with nesting depth > ${maxDepth}`);
      console.log(`⚠️  Deep nesting detected (>${maxDepth} levels):`, deepComments);
    } else {
      console.log(`✅ All comments within reasonable nesting depth (<=${maxDepth})`);
    }
    
    // 6. Validate content relationships
    console.log('\n6. Validating content relationships...');
    const contentTypes = db.prepare("SELECT DISTINCT content_type FROM comments").all();
    console.log('Content types found:', contentTypes.map(ct => ct.content_type));
    
    const commentsWithoutContentId = db.prepare("SELECT COUNT(*) as count FROM comments WHERE content_id IS NULL OR content_id = ''").get();
    if (commentsWithoutContentId.count > 0) {
      warnings.push(`Found ${commentsWithoutContentId.count} comments without content_id`);
      console.log(`⚠️  Comments without content_id: ${commentsWithoutContentId.count}`);
    } else {
      console.log('✅ All comments have content_id');
    }
    
    // 7. Validate user relationships
    console.log('\n7. Validating user relationships...');
    const commentsWithoutUserId = db.prepare("SELECT COUNT(*) as count FROM comments WHERE user_id IS NULL OR user_id = ''").get();
    if (commentsWithoutUserId.count > 0) {
      warnings.push(`Found ${commentsWithoutUserId.count} comments without user_id`);
      console.log(`⚠️  Comments without user_id: ${commentsWithoutUserId.count}`);
    } else {
      console.log('✅ All comments have user_id');
    }
    
    // 8. Check backup table integrity
    console.log('\n8. Validating backup table...');
    const backupExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments_migration_backup'").all();
    
    if (backupExists.length > 0) {
      const backupCount = db.prepare("SELECT COUNT(*) as count FROM comments_migration_backup").get();
      console.log(`✅ Backup table exists with ${backupCount.count} records`);
      results.backupRecords = backupCount.count;
    } else {
      warnings.push('No backup table found');
      console.log('⚠️  No backup table found');
    }
    
    // 9. Test hierarchy building functionality
    console.log('\n9. Testing hierarchy building...');
    
    // Get a sample of comments for one content item
    const sampleContent = db.prepare("SELECT DISTINCT content_id FROM comments LIMIT 1").get();
    
    if (sampleContent) {
      const contentComments = db.prepare(`
        SELECT id, document_id, parent_id, content, user_id, created_at
        FROM comments 
        WHERE content_id = ? 
        ORDER BY created_at ASC
      `).all(sampleContent.content_id);
      
      console.log(`Sample content has ${contentComments.length} comments`);
      
      // Build hierarchy to test the structure
      const hierarchy = buildCommentHierarchy(contentComments);
      const flatCount = contentComments.length;
      const hierarchyCount = countCommentsInHierarchy(hierarchy);
      
      if (flatCount === hierarchyCount) {
        console.log('✅ Hierarchy building preserves all comments');
      } else {
        errors.push(`Hierarchy building lost comments: ${flatCount} -> ${hierarchyCount}`);
        console.log(`❌ Hierarchy building issue: ${flatCount} comments -> ${hierarchyCount} in hierarchy`);
      }
    }
    
    db.close();
    
    // 10. Generate final report
    console.log('\n=== MIGRATION INTEGRITY REPORT ===');
    console.log(`Total Comments: ${results.totalComments}`);
    console.log(`Comments with Parent: ${results.commentsWithParentId}`);
    console.log(`Backup Records: ${results.backupRecords || 'N/A'}`);
    
    if (errors.length === 0) {
      console.log('\n🎉 MIGRATION INTEGRITY: PASSED');
      console.log('All critical validations passed. The migration was successful.');
    } else {
      console.log('\n❌ MIGRATION INTEGRITY: FAILED');
      console.log('Critical errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n=== NEXT STEPS ===');
    if (errors.length === 0) {
      console.log('✅ Migration verification complete - ready for production use');
      console.log('✅ Comment functionality can be tested with the new schema');
      console.log('✅ Frontend integration can proceed');
    } else {
      console.log('❌ Fix the errors above before proceeding');
      console.log('❌ Consider rolling back the migration if errors are critical');
    }
    
    return errors.length === 0;
    
  } catch (error) {
    console.error('Error during verification:', error);
    return false;
  }
}

// Helper function to build comment hierarchy (same logic as service layer)
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

// Helper function to count comments in hierarchy
function countCommentsInHierarchy(hierarchy) {
  let count = 0;
  
  function countRecursive(comments) {
    for (const comment of comments) {
      count++;
      if (comment.replies && comment.replies.length > 0) {
        countRecursive(comment.replies);
      }
    }
  }
  
  countRecursive(hierarchy);
  return count;
}

// Run verification
const success = verifyMigrationIntegrity();
process.exit(success ? 0 : 1);