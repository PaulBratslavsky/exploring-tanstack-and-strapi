'use strict';

/**
 * Migration to convert comment relations to parentId field
 */

async function up(trx, db) {
  console.log('Starting comment schema migration...');
  
  try {
    // Step 1: Check if parentId column already exists
    const hasParentIdColumn = await trx.schema.hasColumn('comments', 'parent_id');
    if (!hasParentIdColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.string('parent_id', 255).nullable();
        table.index('parent_id');
      });
      console.log('Added parentId column to comments table');
    } else {
      console.log('parentId column already exists in comments table');
    }

    // Step 2: Check if we need to migrate from old relation structure
    const hasOldRelationTable = await trx.schema.hasTable('comments_parent_comment_lnk');
    
    if (hasOldRelationTable) {
      console.log('Found old parent comment relation table, migrating data...');
      
      // Create backup table for rollback purposes
      const backupTableExists = await trx.schema.hasTable('comments_migration_backup');
      if (!backupTableExists) {
        await trx.raw(`
          CREATE TABLE comments_migration_backup AS 
          SELECT lnk.comment_id, lnk.inv_comment_id, c.document_id as child_document_id, p.document_id as parent_document_id
          FROM comments_parent_comment_lnk lnk
          JOIN comments c ON lnk.comment_id = c.id
          JOIN comments p ON lnk.inv_comment_id = p.id
        `);
        console.log('Created backup table for rollback');
      }

      // Step 3: Populate parentId from existing parentComment relations
      const parentRelations = await trx('comments_parent_comment_lnk as lnk')
        .join('comments as child', 'lnk.comment_id', 'child.id')
        .join('comments as parent', 'lnk.inv_comment_id', 'parent.id')
        .select(
          'child.id as child_id',
          'child.document_id as child_document_id',
          'parent.document_id as parent_document_id'
        );

      console.log(`Found ${parentRelations.length} comments with parent relationships`);

      // Convert relations to parentId field
      for (const relation of parentRelations) {
        await trx('comments')
          .where('id', relation.child_id)
          .update({ parent_id: relation.parent_document_id });
      }

      console.log('Successfully migrated parent relationships to parentId field');

      // Step 4: Validation - check that all relationships were preserved
      const totalOriginalRelations = await trx('comments_parent_comment_lnk')
        .count('* as count')
        .first();

      const totalCommentsWithParentId = await trx('comments')
        .whereNotNull('parent_id')
        .count('* as count')
        .first();

      console.log(`Original parent relationships: ${totalOriginalRelations.count}`);
      console.log(`Migrated parentId relationships: ${totalCommentsWithParentId.count}`);

      if (totalOriginalRelations.count !== totalCommentsWithParentId.count) {
        throw new Error('Migration validation failed: relationship counts do not match');
      }

      // Step 5: Drop the old relation table after successful migration
      await trx.schema.dropTable('comments_parent_comment_lnk');
      console.log('Removed old parent comment relation table');
      
    } else {
      console.log('No old parent comment relation table found - schema already uses parentId');
      
      // Create a simple backup for current state
      const backupTableExists = await trx.schema.hasTable('comments_migration_backup');
      if (!backupTableExists) {
        await trx.raw(`
          CREATE TABLE comments_migration_backup AS 
          SELECT id, document_id, parent_id, created_at, updated_at 
          FROM comments
        `);
        console.log('Created backup table with current parentId data');
      }
    }

    // Final validation - ensure parentId column exists and is properly indexed
    const finalCheck = await trx.schema.hasColumn('comments', 'parent_id');
    if (!finalCheck) {
      throw new Error('Migration failed: parentId column not found after migration');
    }

    // Check current parentId usage
    const totalCommentsWithParentId = await trx('comments')
      .whereNotNull('parent_id')
      .count('* as count')
      .first();

    console.log(`Total comments with parentId: ${totalCommentsWithParentId.count}`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down(trx, db) {
  console.log('Rolling back comment schema migration...');
  
  try {
    // Step 1: Check what type of backup we have
    const backupExists = await trx.schema.hasTable('comments_migration_backup');
    if (backupExists) {
      // Check if backup has old relation structure or new parentId structure
      const backupColumns = await trx('comments_migration_backup').columnInfo();
      
      if (backupColumns.comment_id && backupColumns.inv_comment_id) {
        // Old relation structure backup
        console.log('Restoring parent comment relations from backup...');
        
        // Create the old relation table
        const relationTableExists = await trx.schema.hasTable('comments_parent_comment_lnk');
        if (!relationTableExists) {
          await trx.schema.createTable('comments_parent_comment_lnk', (table) => {
            table.increments('id').primary();
            table.integer('comment_id').references('id').inTable('comments').onDelete('CASCADE');
            table.integer('inv_comment_id').references('id').inTable('comments').onDelete('CASCADE');
            table.unique(['comment_id', 'inv_comment_id']);
          });
        }
        
        // Clear existing parent_id values
        await trx('comments').update({ parent_id: null });
        
        // Restore relations to comments_parent_comment_lnk table
        const backupData = await trx('comments_migration_backup').select('*');
        
        for (const backup of backupData) {
          // Check if both comments still exist
          const childExists = await trx('comments').where('id', backup.comment_id).first();
          const parentExists = await trx('comments').where('id', backup.inv_comment_id).first();
          
          if (childExists && parentExists) {
            // Restore the relation
            await trx('comments_parent_comment_lnk')
              .insert({
                comment_id: backup.comment_id,
                inv_comment_id: backup.inv_comment_id
              })
              .onConflict(['comment_id', 'inv_comment_id'])
              .ignore();
          }
        }
        
        console.log('Restored parent comment relations');
        
      } else {
        // New parentId structure backup - just restore the parent_id values
        console.log('Restoring parentId values from backup...');
        
        const backupData = await trx('comments_migration_backup').select('*');
        
        for (const backup of backupData) {
          const commentExists = await trx('comments').where('id', backup.id).first();
          if (commentExists) {
            await trx('comments')
              .where('id', backup.id)
              .update({ parent_id: backup.parent_id });
          }
        }
        
        console.log('Restored parentId values');
      }
    } else {
      console.warn('No backup table found - cannot restore previous state');
    }

    // Step 2: Remove parentId column (optional - comment out if you want to keep it)
    // const hasParentIdColumn = await trx.schema.hasColumn('comments', 'parent_id');
    // if (hasParentIdColumn) {
    //   await trx.schema.alterTable('comments', (table) => {
    //     table.dropColumn('parent_id');
    //   });
    //   console.log('Removed parentId column');
    // }

    // Step 3: Clean up backup table
    if (backupExists) {
      await trx.schema.dropTable('comments_migration_backup');
      console.log('Removed backup table');
    }

    console.log('Rollback completed');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };