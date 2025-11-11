/**
 * Script to check the current database state before migration
 */

'use strict';

async function checkDatabaseState() {
  console.log('Checking current database state...');
  
  try {
    const Strapi = require('@strapi/strapi');
    const app = Strapi();
    const knex = app.db.connection;
    
    // Check if comments table exists
    const hasTable = await knex.schema.hasTable('comments');
    console.log('Comments table exists:', hasTable);
    
    if (hasTable) {
      // Check table structure
      const columns = await knex('comments').columnInfo();
      console.log('Current columns:', Object.keys(columns));
      
      // Check if there are any comments
      const count = await knex('comments').count('* as count').first();
      console.log('Total comments:', count.count);
      
      // Check if parentId column exists and has data
      if (columns.parent_id) {
        const withParentId = await knex('comments').whereNotNull('parent_id').count('* as count').first();
        console.log('Comments with parentId:', withParentId.count);
      }
      
      // Check if backup table exists
      const hasBackup = await knex.schema.hasTable('comments_migration_backup');
      console.log('Backup table exists:', hasBackup);
      
      // Check for old relation tables
      const hasParentCommentLnk = await knex.schema.hasTable('comments_parent_comment_lnk');
      console.log('Old parent comment relation table exists:', hasParentCommentLnk);
      
      const hasArticleLnk = await knex.schema.hasTable('comments_article_lnk');
      console.log('Old article relation table exists:', hasArticleLnk);
      
      const hasAuthorLnk = await knex.schema.hasTable('comments_author_lnk');
      console.log('Old author relation table exists:', hasAuthorLnk);
      
      // Sample some data if comments exist
      if (count.count > 0) {
        const sampleComments = await knex('comments')
          .select('id', 'document_id', 'parent_id', 'content_type', 'content_id', 'user_id')
          .limit(3);
        console.log('Sample comments:', sampleComments);
      }
    }
    
    await app.destroy();
    console.log('Database state check completed');
    
  } catch (error) {
    console.error('Error checking database state:', error);
    process.exit(1);
  }
}

checkDatabaseState();