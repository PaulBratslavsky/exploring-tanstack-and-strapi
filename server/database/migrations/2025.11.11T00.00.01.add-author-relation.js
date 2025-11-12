'use strict';

/**
 * Migration to add author relation column
 */

module.exports = {
  async up(knex) {
    console.log('Adding author_id column for author relation...');

    const hasTable = await knex.schema.hasTable('comments');
    if (!hasTable) {
      console.log('Comments table does not exist, skipping migration');
      return;
    }

    const hasAuthorId = await knex.schema.hasColumn('comments', 'author_id');
    
    if (!hasAuthorId) {
      console.log('Adding author_id column...');
      await knex.schema.alterTable('comments', (table) => {
        table.string('author_id', 255).nullable();
        table.index('author_id');
      });
      console.log('✓ Added author_id column');
    } else {
      console.log('author_id column already exists');
    }

    console.log('✅ Author relation migration completed!');
  },

  async down(knex) {
    console.log('Removing author_id column...');

    const hasTable = await knex.schema.hasTable('comments');
    if (!hasTable) {
      return;
    }

    const hasAuthorId = await knex.schema.hasColumn('comments', 'author_id');
    
    if (hasAuthorId) {
      await knex.schema.alterTable('comments', (table) => {
        table.dropColumn('author_id');
      });
      console.log('✓ Removed author_id column');
    }

    console.log('✅ Rollback completed!');
  },
};
