/**
 * Debug script to check authentication and user data
 */

const path = require('path');
const Database = require('better-sqlite3');

function debugAuth() {
  console.log('=== Authentication Debug ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath, { readonly: true });
    
    // 1. Check users table
    console.log('1. Checking users table...');
    
    const hasUsersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='up_users'").all();
    if (hasUsersTable.length > 0) {
      console.log('✅ up_users table exists');
      
      const users = db.prepare('SELECT id, username, email, document_id FROM up_users LIMIT 5').all();
      console.log('Users in database:');
      users.forEach(user => {
        console.log(`  ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, DocumentId: ${user.document_id}`);
      });
      
      // Check which user IDs are used in comments
      console.log('\n2. User IDs used in comments:');
      const commentUserIds = db.prepare('SELECT DISTINCT user_id FROM comments').all();
      commentUserIds.forEach(row => {
        const user = db.prepare('SELECT username, email FROM up_users WHERE id = ?').get(row.user_id);
        console.log(`  user_id: ${row.user_id} -> ${user ? `${user.username} (${user.email})` : 'User not found'}`);
      });
      
    } else {
      console.log('❌ up_users table not found');
    }
    
    // 3. Check comment user_id format
    console.log('\n3. Comment user_id format analysis:');
    const comments = db.prepare('SELECT id, user_id, content FROM comments LIMIT 3').all();
    comments.forEach(comment => {
      console.log(`  Comment ${comment.id}: user_id="${comment.user_id}" (type: ${typeof comment.user_id})`);
    });
    
    db.close();
    
    console.log('\n=== Debug Complete ===');
    console.log('Check the server logs when creating a comment to see the user authentication details.');
    
  } catch (error) {
    console.error('Error during debug:', error);
  }
}

debugAuth();