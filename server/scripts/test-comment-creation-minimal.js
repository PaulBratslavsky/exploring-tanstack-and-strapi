/**
 * Minimal test for comment creation to isolate the issue
 */

const path = require('path');
const Database = require('better-sqlite3');

function testMinimalCommentCreation() {
  console.log('=== Minimal Comment Creation Test ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath);
    
    // 1. Check current state
    console.log('1. Current database state:');
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get();
    console.log(`Current comment count: ${currentCount.count}`);
    
    // 2. Check user IDs that work
    console.log('\n2. Checking existing working user IDs:');
    const existingUserIds = db.prepare('SELECT DISTINCT user_id FROM comments').all();
    console.log('User IDs in existing comments:', existingUserIds.map(row => row.user_id));
    
    // 3. Check if user ID 2 exists in up_users
    const user2 = db.prepare('SELECT * FROM up_users WHERE id = 2').get();
    console.log('User ID 2 details:', user2);
    
    // 4. Test the exact data structure that frontend sends
    console.log('\n3. Testing exact frontend data structure:');
    
    const frontendData = {
      content: 'Test comment from minimal test',
      contentType: 'comment',
      contentId: 'o8rtuc5hjnraaj1v2wbesqyu',
      userId: '2' // This is what the controller sets
    };
    
    console.log('Frontend data:', frontendData);
    
    // 5. Test direct insertion with this data
    const testData = {
      document_id: 'test-minimal-' + Date.now(),
      content: frontendData.content,
      content_type: frontendData.contentType,
      content_id: frontendData.contentId,
      user_id: frontendData.userId,
      parent_id: null,
      is_edited: 0,
      is_deleted: 0,
      is_inappropriate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      created_by_id: null, // This is key - set to null
      updated_by_id: null, // This is key - set to null
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
        testData.document_id,
        testData.content,
        testData.content_type,
        testData.content_id,
        testData.user_id,
        testData.parent_id,
        testData.is_edited,
        testData.is_deleted,
        testData.is_inappropriate,
        testData.created_at,
        testData.updated_at,
        testData.published_at,
        testData.created_by_id,
        testData.updated_by_id,
        testData.locale
      );
      
      console.log(`✅ Direct insertion successful: ID ${result.lastInsertRowid}`);
      
      // Verify
      const created = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
      console.log('Created comment verification:', {
        id: created.id,
        content: created.content,
        user_id: created.user_id,
        content_type: created.content_type,
        content_id: created.content_id,
        created_by_id: created.created_by_id,
        updated_by_id: created.updated_by_id
      });
      
      // Clean up
      db.prepare('DELETE FROM comments WHERE id = ?').run(result.lastInsertRowid);
      console.log('✅ Test comment cleaned up');
      
    } catch (error) {
      console.log('❌ Direct insertion failed:', error.message);
    }
    
    // 6. Check foreign key constraints more carefully
    console.log('\n4. Checking foreign key constraint details:');
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(comments)").all();
    foreignKeys.forEach(fk => {
      console.log(`Foreign key: ${fk.from} -> ${fk.table}.${fk.to} (on_delete: ${fk.on_delete})`);
      
      // Check if the referenced table has the expected IDs
      if (fk.table === 'admin_users') {
        const adminIds = db.prepare(`SELECT id FROM ${fk.table}`).all();
        console.log(`  Available admin_users IDs: ${adminIds.map(row => row.id).join(', ')}`);
      } else if (fk.table === 'up_users') {
        const userIds = db.prepare(`SELECT id FROM ${fk.table}`).all();
        console.log(`  Available up_users IDs: ${userIds.map(row => row.id).join(', ')}`);
      }
    });
    
    db.close();
    
    console.log('\n=== Analysis ===');
    console.log('The issue is likely that Strapi is trying to set created_by_id/updated_by_id');
    console.log('to a user ID that doesn\'t exist in the admin_users table.');
    console.log('The solution is to ensure these fields are set to null for regular user operations.');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testMinimalCommentCreation();