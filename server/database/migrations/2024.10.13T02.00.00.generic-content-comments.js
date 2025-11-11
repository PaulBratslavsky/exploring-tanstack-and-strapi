'use strict';

/**
 * Migration to convert from article relation to generic content approach
 */

async function up(trx, db) {
  console.log('Starting generic content comments migration...');
  
  try {
    // Step 1: Check if columns already exist
    const hasContentTypeColumn = await trx.schema.hasColumn('comments', 'content_type');
    const hasContentIdColumn = await trx.schema.hasColumn('comments', 'content_id');

    if (!hasContentTypeColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.string('content_type').nullable().defaultTo('content');
      });
      console.log('Added content_type column');
    } else {
      console.log('content_type column already exists');
    }

    if (!hasContentIdColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.string('content_id', 255).nullable().defaultTo('');
        table.index(['content_type', 'content_id']);
      });
      console.log('Added content_id column with index');
    } else {
      console.log('content_id column already exists');
    }

    // Step 2: Check if we need to migrate from old relation structure
    const hasArticleLinkTable = await trx.schema.hasTable('comments_article_lnk');
    
    if (hasArticleLinkTable) {
      console.log('Found old article relation table, migrating data...');
      
      // Migrate existing article relations to contentType/contentId
      const articleRelations = await trx('comments_article_lnk as lnk')
        .join('articles as a', 'lnk.article_id', 'a.id')
        .join('comments as c', 'lnk.comment_id', 'c.id')
        .select(
          'c.id as comment_id',
          'a.document_id as article_document_id'
        );

      console.log(`Found ${articleRelations.length} article relations to migrate`);

      // Update comments with article relations
      for (const relation of articleRelations) {
        await trx('comments')
          .where('id', relation.comment_id)
          .update({
            content_type: 'comment',
            content_id: relation.article_document_id
          });
      }

      console.log('Migrated article relations to generic content approach');

      // Drop the old article relation table
      await trx.schema.dropTable('comments_article_lnk');
      console.log('Removed comments_article_lnk table');
    } else {
      console.log('No old article relation table found - schema already uses generic approach');
    }

    // Step 3: Handle comments without content mapping (set default values)
    const commentsWithoutContent = await trx('comments')
      .where(function() {
        this.whereNull('content_id').orWhere('content_id', '');
      })
      .select('id', 'document_id');

    console.log(`Found ${commentsWithoutContent.length} comments without content mapping`);

    for (const comment of commentsWithoutContent) {
      await trx('comments')
        .where('id', comment.id)
        .update({
          content_type: 'content',
          content_id: `default-content-${comment.document_id}`
        });
    }

    if (commentsWithoutContent.length > 0) {
      console.log('Set default content mapping for comments without relations');
    }

    // Step 4: Add index if it doesn't exist
    try {
      await trx.raw('CREATE INDEX IF NOT EXISTS comments_content_type_id_idx ON comments (content_type, content_id)');
      console.log('Ensured content_type/content_id index exists');
    } catch (error) {
      console.log('Index may already exist, continuing...');
    }

    // Step 5: Final validation
    const totalComments = await trx('comments').count('* as count').first();
    const commentsWithContent = await trx('comments')
      .whereNotNull('content_id')
      .whereNot('content_id', '')
      .count('* as count')
      .first();

    console.log(`Total comments: ${totalComments.count}`);
    console.log(`Comments with content mapping: ${commentsWithContent.count}`);

    if (totalComments.count !== commentsWithContent.count) {
      console.warn('Some comments may not have content mapping, but migration will continue');
    }

    console.log('Generic content comments migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down(trx, db) {
  console.log('Rolling back generic content comments migration...');
  
  try {
    // Step 1: Recreate article relation table
    await trx.schema.createTable('comments_article_lnk', (table) => {
      table.increments('id').primary();
      table.integer('comment_id').references('id').inTable('comments').onDelete('CASCADE');
      table.integer('article_id').references('id').inTable('articles').onDelete('CASCADE');
      table.unique(['comment_id', 'article_id']);
    });

    // Step 2: Restore article relations for comments with contentType 'comment'
    const articleComments = await trx('comments')
      .where('content_type', 'comment')
      .select('id', 'content_id');

    for (const comment of articleComments) {
      // Find article by document_id
      const article = await trx('articles')
        .where('document_id', comment.content_id)
        .select('id')
        .first();

      if (article) {
        await trx('comments_article_lnk').insert({
          comment_id: comment.id,
          article_id: article.id
        });
      }
    }

    // Step 3: Remove generic content columns
    const hasContentTypeColumn = await trx.schema.hasColumn('comments', 'content_type');
    const hasContentIdColumn = await trx.schema.hasColumn('comments', 'content_id');

    if (hasContentTypeColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.dropColumn('content_type');
      });
    }

    if (hasContentIdColumn) {
      await trx.schema.alterTable('comments', (table) => {
        table.dropColumn('content_id');
      });
    }

    console.log('Rollback completed');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };