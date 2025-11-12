/**
 * comment controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::comment.comment",
  ({ strapi }) => ({


    // Override create to set author from authenticated user
    async create(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized("You must be logged in to comment");
      }

      const { data } = ctx.request.body;

      // Create comment with author set server-side
      const entity = await strapi.documents("api::comment.comment").create({
        data: {
          ...data,
          author: {
            set: [user.documentId],
          },
        },
        populate: {
          author: {
            fields: ["username"],
          },
        },
      });

      // Sanitize response
      const sanitizedEntity = {
        ...entity,
        author: entity.author
          ? {
              id: entity.author.id,
              documentId: entity.author.documentId,
              username: entity.author.username,
            }
          : null,
      };

      return { data: sanitizedEntity };
    },

    // Custom method: Find comments with author username populated (for custom route)
    async getComments(ctx) {
      const { query } = ctx;

      console.log("Raw query:", JSON.stringify(query, null, 2));

      // Build the query params directly from ctx.query to preserve relation filters
      const queryParams = {
        filters: query.filters || {},
        populate: {
          author: {
            fields: ["username"],
          },
        },
        pagination: query.pagination || { page: 1, pageSize: 25 },
        sort: query.sort || [],
      };

      console.log("Query params:", JSON.stringify(queryParams, null, 2));

      // Use the service layer to get entities with pagination
      const { results, pagination } = await strapi
        .service("api::comment.comment")
        .find(queryParams);

      console.log("Found comments:", results.length);

      // Sanitize to only include username from author
      const sanitizedEntities = results.map((entity) => ({
        ...entity,
        author: entity.author
          ? {
              id: entity.author.id,
              documentId: entity.author.documentId,
              username: entity.author.username,
            }
          : null,
      }));

      return {
        data: sanitizedEntities,
        meta: { pagination },
      };
    },

    // Custom method: Create comment with author set server-side (for custom route)
    async createWithUser(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized("You must be logged in to comment");
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
    },
  })
);
