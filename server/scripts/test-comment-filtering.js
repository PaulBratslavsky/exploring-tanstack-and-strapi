/**
 * Test script to check comment filtering by contentId
 */

const path = require('path');
const Database = require('better-sqlite3');

function testCommentFiltering() {
  console.log('=== Testing Comment Filtering by ContentId ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath, { readonly: true });
    
    // 1. Show all comments and their contentId
    console.log('1. All comments in database:');
    const allComments = db.prepare(`
      SELECT id, document_id, content_id, content_type, 
             SUBSTR(content, 1, 30) as content_preview
      FROM comments 
      WHERE is_deleted = 0
      ORDER BY content_id, created_at
    `).all();
    
    allComments.forEach(comment => {
      console.log(`  ID: ${comment.id}, ContentId: ${comment.content_id}, Content: "${comment.content_preview}..."`);
    });
    
    // 2. Group by contentId
    console.log('\n2. Comments grouped by contentId:');
    const contentGroups = db.prepare(`
      SELECT content_id, COUNT(*) as count
      FROM comments 
      WHERE is_deleted = 0
      GROUP BY content_id
    `).all();
    
    contentGroups.forEach(group => {
      console.log(`  ContentId: ${group.content_id} -> ${group.count} comments`);
      
      // Show comments for this contentId
      const commentsForContent = db.prepare(`
        SELECT document_id, SUBSTR(content, 1, 40) as preview
        FROM comments 
        WHERE content_id = ? AND is_deleted = 0
        ORDER BY created_at
      `).all(group.content_id);
      
      commentsForContent.forEach(comment => {
        console.log(`    - ${comment.document_id}: "${comment.preview}..."`);
      });
      console.log('');
    });
    
    // 3. Test specific contentId filtering
    console.log('3. Testing specific contentId filtering:');
    const testContentId = 'o8rtuc5hjnraaj1v2wbesqyu';
    
    const filteredComments = db.prepare(`
      SELECT id, document_id, content_id, SUBSTR(content, 1, 30) as preview
      FROM comments 
      WHERE content_id = ? AND is_deleted = 0
      ORDER BY created_at
    `).all(testContentId);
    
    console.log(`\nFiltering for contentId: ${testContentId}`);
    console.log(`Found ${filteredComments.length} comments:`);
    
    filteredComments.forEach(comment => {
      console.log(`  - ${comment.document_id}: "${comment.preview}..."`);
    });
    
    // 4. Test the other contentId
    const otherContentId = 'be9fsxd1j04vgqdsmgq6edsp';
    const otherComments = db.prepare(`
      SELECT id, document_id, content_id, SUBSTR(content, 1, 30) as preview
      FROM comments 
      WHERE content_id = ? AND is_deleted = 0
      ORDER BY created_at
    `).all(otherContentId);
    
    console.log(`\nFiltering for contentId: ${otherContentId}`);
    console.log(`Found ${otherComments.length} comments:`);
    
    otherComments.forEach(comment => {
      console.log(`  - ${comment.document_id}: "${comment.preview}..."`);
    });
    
    // 5. Check if there are any articles to match these contentIds
    console.log('\n4. Checking articles table:');
    const articles = db.prepare('SELECT id, document_id, title FROM articles').all();
    
    console.log('Available articles:');
    articles.forEach(article => {
      const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE content_id = ?').get(article.document_id);
      console.log(`  - ${article.document_id}: "${article.title}" (${commentCount.count} comments)`);
    });
    
    db.close();
    
    console.log('\n=== Analysis ===');
    console.log('If comments are showing on all blog posts, the issue is likely:');
    console.log('1. Frontend is not sending the correct contentId filter');
    console.log('2. The API is not applying the contentId filter correctly');
    console.log('3. The service layer is not using the filter properly');
    
    console.log('\nThe database filtering works correctly as shown above.');
    console.log('Check the frontend network requests to see what filters are being sent.');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testCommentFiltering();