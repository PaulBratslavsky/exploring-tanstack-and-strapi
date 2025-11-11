'use strict';

/**
 * Migration to convert from author relation to simple userId field
 */

async function up(trx, db) {
  console.log('Starting author to userId conversion migration...');
  
  try {
    // Step 1: Add userId column if it doesn't exist
    const hasUserIdColumn = await trx.schema.hasColumn('comments', 'user_id');
    if (!hasUserIdColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.string('user_id', 255).nullable();
        table.index('user_id');
      });
      console.log('Added user_id column');
    } else {
      console.log('user_id column already exists');
    }

    // Step 2: Check if author relation table exists and migrate if needed
    const hasAuthorLinkTable = await trx.schema.hasTable('comments_author_lnk');
    
    if (hasAuthorLinkTable) {
      console.log('Found author relation table, migrating data...');
      
      // Migrate existing author relations to userId
      const authorRelations = await trx('comments_author_lnk as lnk')
        .join('up_users as u', 'lnk.user_id', 'u.id')
        .join('comments as c', 'lnk.comment_id', 'c.id')
        .select(
          'c.id as comment_id',
          'u.document_id as user_document_id'
        );

      console.log(`Found ${authorRelations.length} author relations to migrate`);

      // Update comments with author relations
      for (const relation of authorRelations) {
        await trx('comments')
          .where('id', relation.comment_id)
          .update({
            user_id: relation.user_document_id
          });
      }

      console.log('Migrated author relations to userId field');

      // Drop the old author relation table
      await trx.schema.dropTable('comments_author_lnk');
      console.log('Removed comments_author_lnk table');
    } else {
      console.log('No author relation table found - schema already uses userId approach');
    }

    // Step 3: Handle comments without userId (set default values)
    const commentsWithoutUserId = await trx('comments')
      .whereNull('user_id')
      .orWhere('user_id', '')
      .select('id', 'document_id');

    console.log(`Found ${commentsWithoutUserId.length} comments without userId`);

    for (const comment of commentsWithoutUserId) {
      await trx('comments')
        .where('id', comment.id)
        .update({
          user_id: `anonymous-${comment.document_id}`
        });
    }

    if (commentsWithoutUserId.length > 0) {
      console.log('Set default userId for comments without author relations');
    }

    // Step 4: Final validation
    const totalComments = await trx('comments').count('* as count').first();
    const commentsWithUserId = await trx('comments')
      .whereNotNull('user_id')
      .whereNot('user_id', '')
      .count('* as count')
      .first();

    console.log(`Total comments: ${totalComments.count}`);
    console.log(`Comments with userId: ${commentsWithUserId.count}`);

    if (totalComments.count !== commentsWithUserId.count) {
      console.warn('Some comments may not have userId, but migration will continue');
    }

    console.log('Author to userId conversion migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down(trx, db) {
  console.log('Rolling back author to userId conversion migration...');
  
  try {
    // Step 1: Recreate author relation table
    await trx.schema.createTable('comments_author_lnk', (table) => {
      table.increments('id').primary();
      table.integer('comment_id').references('id').inTable('comments').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('up_users').onDelete('CASCADE');
      table.unique(['comment_id', 'user_id']);
    });

    // Step 2: Restore author relations for comments with userId
    const commentsWithUserId = await trx('comments')
      .whereNotNull('user_id')
      .whereNot('user_id', '')
      .select('id', 'user_id');

    for (const comment of commentsWithUserId) {
      // Skip anonymous users
      if (comment.user_id.startsWith('anonymous-')) {
        continue;
      }

      // Find user by document_id
      const user = await trx('up_users')
        .where('document_id', comment.user_id)
        .select('id')
        .first();

      if (user) {
        await trx('comments_author_lnk').insert({
          comment_id: comment.id,
          user_id: user.id
        });
      }
    }

    // Step 3: Remove userId column
    const hasUserIdColumn = await trx.schema.hasColumn('comments', 'user_id');
    if (hasUserIdColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.dropColumn('user_id');
      });
    }

    console.log('Rollback completed');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };