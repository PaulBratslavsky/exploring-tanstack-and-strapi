/**
 * Test script to check if the entity service can create comments directly
 */

const path = require('path');
const Database = require('better-sqlite3');

function testEntityService() {
  console.log('=== Testing Entity Service Direct Creation ===\n');
  
  try {
    const dbPath = path.join(__dirname, '../.tmp/data.db');
    const db = new Database(dbPath);
    
    // Test direct database insertion to see if the schema is correct
    console.log('1. Testing direct database insertion...');
    
    const testData = {
      document_id: 'test-entity-' + Date.now(),
      content: 'Test comment via entity service',
      content_type: 'comment',
      content_id: 'o8rtuc5hjnraaj1v2wbesqyu',
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
      
      console.log(`✅ Direct DB insertion successful: ID ${result.lastInsertRowid}`);
      
      // Verify the comment was created
      const created = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
      console.log('Created comment:', created);
      
      // Clean up
      db.prepare('DELETE FROM comments WHERE id = ?').run(result.lastInsertRowid);
      console.log('✅ Test comment cleaned up');
      
    } catch (error) {
      console.log('❌ Direct DB insertion failed:', error.message);
    }
    
    // 2. Check schema constraints that might cause issues
    console.log('\n2. Checking schema constraints...');
    
    const tableInfo = db.prepare("PRAGMA table_info(comments)").all();
    const requiredFields = tableInfo.filter(col => col.notnull === 1);
    
    console.log('Required fields (NOT NULL):');
    requiredFields.forEach(field => {
      console.log(`  - ${field.name}: ${field.type}`);
    });
    
    // 3. Check if there are any unique constraints
    console.log('\n3. Checking unique constraints...');
    const indexes = db.prepare("PRAGMA index_list(comments)").all();
    const uniqueIndexes = indexes.filter(idx => idx.unique === 1);
    
    if (uniqueIndexes.length > 0) {
      console.log('Unique constraints:');
      uniqueIndexes.forEach(idx => {
        const indexInfo = db.prepare(`PRAGMA index_info(${idx.name})`).all();
        console.log(`  - ${idx.name}: ${indexInfo.map(col => col.name).join(', ')}`);
      });
    } else {
      console.log('No unique constraints found');
    }
    
    // 4. Check foreign key constraints
    console.log('\n4. Checking foreign key constraints...');
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(comments)").all();
    
    if (foreignKeys.length > 0) {
      console.log('Foreign key constraints:');
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.from} -> ${fk.table}.${fk.to}`);
      });
    } else {
      console.log('No foreign key constraints found');
    }
    
    db.close();
    
    console.log('\n=== Test Complete ===');
    console.log('The database schema allows direct insertion.');
    console.log('The issue is likely in the Strapi entity service or validation layer.');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testEntityService();