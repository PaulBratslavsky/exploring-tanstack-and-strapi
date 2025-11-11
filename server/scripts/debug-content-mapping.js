/**
 * Debug script to check content mapping issues
 */

const path = require('path');
const Database = require('better-sqlite3');

function debugContentMapping() {
  console.log('=== Debugging Content Mapping Issues ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath, { readonly: true });
    
    // 1. Show all comments with their content mapping
    console.log('1. ALL COMMENTS AND THEIR CONTENT MAPPING:');
    const allComments = db.prepare(`
      SELECT id, document_id, content_type, content_id, parent_id, 
             SUBSTR(content, 1, 50) as content_preview
      FROM comments 
      ORDER BY created_at ASC
    `).all();
    
    allComments.forEach(comment => {
      console.log(`Comment ID: ${comment.id}`);
      console.log(`  Document ID: ${comment.document_id}`);
      console.log(`  Content Type: ${comment.content_type}`);
      console.log(`  Content ID: ${comment.content_id}`);
      console.log(`  Parent ID: ${comment.parent_id || 'null (root)'}`);
      console.log(`  Content: "${comment.content_preview}..."`);
      console.log('  ---');
    });
    
    // 2. Group comments by content_id
    console.log('\n2. COMMENTS GROUPED BY CONTENT_ID:');
    const contentGroups = db.prepare(`
      SELECT content_id, COUNT(*) as comment_count
      FROM comments 
      GROUP BY content_id
      ORDER BY comment_count DESC
    `).all();
    
    contentGroups.forEach(group => {
      console.log(`Content ID: ${group.content_id} - ${group.comment_count} comments`);
      
      const commentsInGroup = db.prepare(`
        SELECT document_id, parent_id, SUBSTR(content, 1, 30) as preview
        FROM comments 
        WHERE content_id = ?
        ORDER BY created_at ASC
      `).all(group.content_id);
      
      commentsInGroup.forEach(comment => {
        const indent = comment.parent_id ? '    └─ ' : '  ├─ ';
        console.log(`${indent}${comment.document_id}: "${comment.preview}..."`);
      });
      console.log('');
    });
    
    // 3. Check if there are any articles/content items to compare
    console.log('3. CHECKING FOR ARTICLES/CONTENT ITEMS:');
    
    // Check for articles table
    const hasArticles = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='articles'").all();
    if (hasArticles.length > 0) {
      console.log('Articles table found. Checking articles:');
      const articles = db.prepare('SELECT id, document_id, title FROM articles LIMIT 5').all();
      articles.forEach(article => {
        console.log(`Article: ${article.id} - ${article.document_id} - "${article.title}"`);
      });
    } else {
      console.log('No articles table found.');
    }
    
    // Check for other content tables
    const contentTables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE 'comments%'
      AND name NOT LIKE 'up_%'
      AND name NOT LIKE 'strapi_%'
      AND name NOT LIKE 'admin_%'
    `).all();
    
    console.log('\nOther content tables found:');
    contentTables.forEach(table => {
      console.log(`- ${table.name}`);
    });
    
    // 4. Check the backup table to see original mapping
    console.log('\n4. CHECKING BACKUP TABLE FOR ORIGINAL MAPPING:');
    const hasBackup = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments_migration_backup'").all();
    
    if (hasBackup.length > 0) {
      const backupColumns = db.prepare("PRAGMA table_info(comments_migration_backup)").all();
      console.log('Backup table columns:', backupColumns.map(col => col.name));
      
      const backupData = db.prepare('SELECT * FROM comments_migration_backup LIMIT 5').all();
      console.log('Sample backup data:');
      backupData.forEach(record => {
        console.log(record);
      });
    }
    
    db.close();
    
  } catch (error) {
    console.error('Error debugging content mapping:', error);
  }
}

debugContentMapping();