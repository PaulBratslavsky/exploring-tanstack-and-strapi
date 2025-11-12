'use strict';

/**
 * Migration to update comment schema:
 * - Rename content_id to article_id
 * - Remove content_type column
 * - Rename user_id to author_id (for relation)
 */

module.exports = {
  async up(knex) {
    console.log('Running comment schema migration...');

    // Check if the comments table exists
    const hasTable = await knex.schema.hasTable('comments');
    if (!hasTable) {
      console.log('Comments table does not exist, skipping migration');
      return;
    }

    // Check which columns exist
    const hasContentId = await knex.schema.hasColumn('comments', 'content_id');
    const hasContentType = await knex.schema.hasColumn('comments', 'content_type');
    const hasUserId = await knex.schema.hasColumn('comments', 'user_id');
    const hasArticleId = await knex.schema.hasColumn('comments', 'article_id');
    const hasAuthorId = await knex.schema.hasColumn('comments', 'author_id');

    console.log('Current schema:', {
      hasContentId,
      hasContentType,
      hasUserId,
      hasArticleId,
      hasAuthorId
    });

    // Step 1: Rename content_id to article_id if needed
    if (hasContentId && !hasArticleId) {
      console.log('Renaming content_id to article_id...');
      await knex.schema.alterTable('comments', (table) => {
        table.renameColumn('content_id', 'article_id');
      });
      console.log('✓ Renamed content_id to article_id');
    }

    // Step 2: Drop content_type column if it exists
    if (hasContentType) {
      console.log('Dropping content_type column...');
      await knex.schema.alterTable('comments', (table) => {
        table.dropColumn('content_type');
      });
      console.log('✓ Dropped content_type column');
    }

    // Step 3: Rename user_id to author_id for the relation
    if (hasUserId && !hasAuthorId) {
      console.log('Renaming user_id to author_id...');
      await knex.schema.alterTable('comments', (table) => {
        table.renameColumn('user_id', 'author_id');
      });
      console.log('✓ Renamed user_id to author_id');
    }

    console.log('✅ Comment schema migration completed successfully!');
  },

  async down(knex) {
    console.log('Rolling back comment schema migration...');

    const hasTable = await knex.schema.hasTable('comments');
    if (!hasTable) {
      console.log('Comments table does not exist, skipping rollback');
      return;
    }

    const hasArticleId = await knex.schema.hasColumn('comments', 'article_id');
    const hasAuthorId = await knex.schema.hasColumn('comments', 'author_id');
    const hasContentType = await knex.schema.hasColumn('comments', 'content_type');

    // Reverse Step 3: Rename author_id back to user_id
    if (hasAuthorId) {
      console.log('Renaming author_id back to user_id...');
      await knex.schema.alterTable('comments', (table) => {
        table.renameColumn('author_id', 'user_id');
      });
      console.log('✓ Renamed author_id back to user_id');
    }

    // Reverse Step 2: Re-add content_type column
    if (!hasContentType) {
      console.log('Re-adding content_type column...');
      await knex.schema.alterTable('comments', (table) => {
        table.string('content_type').defaultTo('comment');
      });
      console.log('✓ Re-added content_type column');
    }

    // Reverse Step 1: Rename article_id back to content_id
    if (hasArticleId) {
      console.log('Renaming article_id back to content_id...');
      await knex.schema.alterTable('comments', (table) => {
        table.renameColumn('article_id', 'content_id');
      });
      console.log('✓ Renamed article_id back to content_id');
    }

    console.log('✅ Rollback completed!');
  },
};
