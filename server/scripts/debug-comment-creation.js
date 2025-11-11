/**
 * Debug script to test comment creation directly
 */

const path = require('path');
const Database = require('better-sqlite3');

function debugCommentCreation() {
  console.log('=== Debugging Comment Creation ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath);
    
    // 1. Check current comment structure
    console.log('1. Current comment structure:');
    const sampleComment = db.prepare('SELECT * FROM comments LIMIT 1').get();
    if (sampleComment) {
      console.log('Sample comment fields:', Object.keys(sampleComment));
      console.log('Sample comment data:', sampleComment);
    }
    
    // 2. Check if we can create a test comment manually
    console.log('\n2. Testing manual comment creation...');
    
    const testCommentData = {
      document_id: 'test-debug-' + Date.now(),
      content: 'Test comment for debugging',
      content_type: 'comment',
      content_id: 'o8rtuc5hjnraaj1v2wbesqyu', // Use existing content ID
      user_id: '2',
      parent_id: null,
      is_edited: 0,
      is_deleted: 0,
      is_inappropriate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      created_by_id: null,
      updated_by_id: null,
      locale: null
    };
    
    try {
      const insertStmt = db.prepare(`
        INSERT INTO comments (
          document_id, content, content_type, content_id, user_id, parent_id,
          is_edited, is_deleted, is_inappropriate, created_at, updated_at,
          published_at, created_by_id, updated_by_id, locale
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertStmt.run(
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
        testCommentData.updated_at,
        testCommentData.published_at,
        testCommentData.created_by_id,
        testCommentData.updated_by_id,
        testCommentData.locale
      );
      
      console.log(`✅ Successfully created test comment with ID: ${result.lastInsertRowid}`);
      
      // Verify the comment was created
      const createdComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
      console.log('Created comment:', createdComment);
      
      // Clean up
      db.prepare('DELETE FROM comments WHERE id = ?').run(result.lastInsertRowid);
      console.log('✅ Test comment cleaned up');
      
    } catch (error) {
      console.log('❌ Failed to create test comment:', error.message);
    }
    
    // 3. Check schema constraints
    console.log('\n3. Checking schema constraints...');
    
    const tableInfo = db.prepare("PRAGMA table_info(comments)").all();
    console.log('Table schema:');
    tableInfo.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // 4. Check triggers
    console.log('\n4. Checking triggers...');
    const triggers = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='trigger' AND tbl_name='comments'").all();
    if (triggers.length > 0) {
      console.log('Active triggers:');
      triggers.forEach(trigger => {
        console.log(`  ${trigger.name}:`);
        console.log(`    ${trigger.sql}`);
      });
    } else {
      console.log('No triggers found on comments table');
    }
    
    // 5. Check indexes
    console.log('\n5. Checking indexes...');
    const indexes = db.prepare("PRAGMA index_list(comments)").all();
    if (indexes.length > 0) {
      console.log('Indexes:');
      indexes.forEach(index => {
        const indexInfo = db.prepare(`PRAGMA index_info(${index.name})`).all();
        console.log(`  ${index.name}: ${indexInfo.map(col => col.name).join(', ')}`);
      });
    } else {
      console.log('No indexes found on comments table');
    }
    
    db.close();
    
    console.log('\n=== Debug Complete ===');
    
  } catch (error) {
    console.error('Error during debug:', error);
  }
}

debugCommentCreation();