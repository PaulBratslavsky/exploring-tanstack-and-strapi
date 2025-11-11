'use strict';

/**
 * Migration to simplify comment schema by removing moderation fields
 */

async function up(trx, db) {
  console.log('Starting comment schema simplification...');
  
  try {
    // Check which moderation columns exist and remove them
    const moderationColumns = [
      'is_approved',
      'is_flagged', 
      'moderation_status',
      'moderated_at'
    ];

    for (const column of moderationColumns) {
      const hasColumn = await trx.schema.hasColumn('comments', column);
      if (hasColumn) {
        await trx.schema.alterTable('comments', (table) => {
          table.dropColumn(column);
        });
        console.log(`Removed ${column} column`);
      }
    }

    // Add isInappropriate column if it doesn't exist
    const hasInappropriateColumn = await trx.schema.hasColumn('comments', 'is_inappropriate');
    if (!hasInappropriateColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.boolean('is_inappropriate').defaultTo(false);
      });
      console.log('Added is_inappropriate column');
    }

    // Remove moderation relation tables if they exist
    const moderationTables = [
      'comments_moderated_by_lnk'
    ];

    for (const tableName of moderationTables) {
      const hasTable = await trx.schema.hasTable(tableName);
      if (hasTable) {
        await trx.schema.dropTable(tableName);
        console.log(`Removed ${tableName} table`);
      }
    }

    console.log('Comment schema simplification completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down(trx, db) {
  console.log('Rolling back comment schema simplification...');
  
  try {
    // Add back moderation columns
    await trx.schema.alterTable('comments', (table) => {
      table.boolean('is_approved').defaultTo(true);
      table.boolean('is_flagged').defaultTo(false);
      table.string('moderation_status').defaultTo('approved');
      table.datetime('moderated_at').nullable();
    });

    // Remove isInappropriate column
    const hasInappropriateColumn = await trx.schema.hasColumn('comments', 'is_inappropriate');
    if (hasInappropriateColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.dropColumn('is_inappropriate');
      });
    }

    // Recreate moderation relation table
    await trx.schema.createTable('comments_moderated_by_lnk', (table) => {
      table.increments('id').primary();
      table.integer('comment_id').references('id').inTable('comments').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('up_users').onDelete('CASCADE');
      table.unique(['comment_id', 'user_id']);
    });

    console.log('Rollback completed');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };