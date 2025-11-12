/**
 * comment controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController('api::comment.comment', ({ strapi }) => ({
  // Override find to populate author with only username
  async find(ctx) {
    const { query } = ctx;

    const entities = await strapi.documents('api::comment.comment').findMany({
      ...query,
      populate: {
        author: {
          fields: ['username']
        }
      }
    });

    console.log('Found comments:', entities)
    
    // Sanitize to only include username from author
    const sanitizedEntities = entities.map(entity => ({
      ...entity,
      author: entity.author ? {
        id: entity.author.id,
        documentId: entity.author.documentId,
        username: entity.author.username
      } : null
    }));

    console.log('Sanitized comments:', sanitizedEntities)

    return {
      data: sanitizedEntities,
      meta: {}
    };
  },

  // Override findOne to populate author with only username
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.documents('api::comment.comment').findOne({
      documentId: id,
      populate: {
        author: {
          fields: ['username']
        }
      }
    });

    if (!entity) {
      return ctx.notFound('Comment not found');
    }

    // Sanitize to only include username from author
    const sanitizedEntity = {
      ...entity,
      author: entity.author ? {
        id: entity.author.id,
        documentId: entity.author.documentId,
        username: entity.author.username
      } : null
    };

    return sanitizedEntity;
  },

  // Override create to set author from authenticated user
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to comment');
    }

    const { data } = ctx.request.body;

    // Create comment with author set server-side
    const entity = await strapi.documents('api::comment.comment').create({
      data: {
        ...data,
        author: {
          set: [user.documentId]
        }
      },
      populate: {
        author: {
          fields: ['username']
        }
      }
    });

    // Sanitize response
    const sanitizedEntity = {
      ...entity,
      author: entity.author ? {
        id: entity.author.id,
        documentId: entity.author.documentId,
        username: entity.author.username
      } : null
    };

    return { data: sanitizedEntity };
  },

  // Custom method: Find comments with author username populated (for custom route)
  async findWithUser(ctx) {
    // TEMPORARY: Return test data for debugging
    const testData = [
      {
        id: 1,
        documentId: "test-doc-1",
        content: "This is a test comment 1",
        articleId: "test-article-123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 1,
          documentId: "user-doc-1",
          username: "testuser1",
        },
      },
      {
        id: 2,
        documentId: "test-doc-2",
        content: "This is a test comment 2",
        articleId: "test-article-123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 2,
          documentId: "user-doc-2",
          username: "testuser2",
        },
      },
      {
        id: 3,
        documentId: "test-doc-3",
        content: "This is a test comment 3",
        articleId: "test-article-456",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: 3,
          documentId: "user-doc-3",
          username: "testuser3",
        },
      },
    ];

    return testData;
  },

  // Custom method: Create comment with author set server-side (for custom route)
  async createWithUser(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to comment');
    }

    const { data } = ctx.request.body;

    // TEMPORARY: Return test data for debugging
    const testResponse = {
      id: Math.floor(Math.random() * 10000),
      documentId: "test-doc-" + Date.now(),
      content: data.content,
      articleId: data.articleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: user.id,
        documentId: user.documentId,
        username: user.username,
      },
    };

    return testResponse;
  }
}));
