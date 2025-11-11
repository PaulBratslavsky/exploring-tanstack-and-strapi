/**
 * Simple script to check database state using direct database connection
 */

const path = require('path');
const Database = require('better-sqlite3');

function checkDatabaseState() {
  console.log('Checking database state...');
  
  try {
    // Connect to the SQLite database
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath, { readonly: true });
    
    // Check if comments table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments'").all();
    console.log('Comments table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Get table info
      const columns = db.prepare("PRAGMA table_info(comments)").all();
      console.log('Current columns:', columns.map(col => col.name));
      
      // Count comments
      const count = db.prepare("SELECT COUNT(*) as count FROM comments").get();
      console.log('Total comments:', count.count);
      
      // Check for parentId data
      const hasParentId = columns.some(col => col.name === 'parent_id');
      if (hasParentId) {
        const withParentId = db.prepare("SELECT COUNT(*) as count FROM comments WHERE parent_id IS NOT NULL").get();
        console.log('Comments with parentId:', withParentId.count);
      }
      
      // Check for backup table
      const backupTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments_migration_backup'").all();
      console.log('Backup table exists:', backupTables.length > 0);
      
      // Check for old relation tables
      const oldTables = [
        'comments_parent_comment_lnk',
        'comments_article_lnk', 
        'comments_author_lnk'
      ];
      
      for (const tableName of oldTables) {
        const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`).all();
        console.log(`${tableName} exists:`, exists.length > 0);
      }
      
      // Sample data if comments exist
      if (count.count > 0) {
        const sampleComments = db.prepare("SELECT id, document_id, parent_id, content_type, content_id, user_id FROM comments LIMIT 3").all();
        console.log('Sample comments:', sampleComments);
      }
    }
    
    db.close();
    console.log('Database check completed');
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

checkDatabaseState();