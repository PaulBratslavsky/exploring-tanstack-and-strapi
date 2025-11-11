/**
 * comment controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::comment.comment",
  ({ strapi }) => ({
    // Find comments for an article with hierarchical structure
    async find(ctx) {
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      const existingFilters: any =
        sanitizedQuery.filters && typeof sanitizedQuery.filters === "object"
          ? sanitizedQuery.filters
          : {};

      // Handle legacy filter format - convert article.documentId to contentId
      if (existingFilters.article?.documentId?.$eq) {
        existingFilters.contentType = 'comment';
        existingFilters.contentId = existingFilters.article.documentId.$eq;
        delete existingFilters.article;
      }

      sanitizedQuery.filters = {
        ...existingFilters,
        isDeleted: false,
      };

      // Remove populate since we don't have relations anymore
      // The service layer will build the hierarchy
      delete sanitizedQuery.populate;

      try {
        // Check if this is a request for a specific article's comments
        const filters: any = sanitizedQuery.filters;
        if (filters.contentType && filters.contentId) {
          // Use the new service method that builds hierarchy
          const results = await strapi
            .service("api::comment.comment")
            .findCommentsForContent(
              filters.contentType,
              filters.contentId,
              { ...sanitizedQuery, filters: undefined }
            );
          
          const sanitizedResults = await this.sanitizeOutput(results, ctx);
          return this.transformResponse(sanitizedResults);
        } else {
          // Fallback to regular find for other queries
          const { results, pagination } = await strapi
            .service("api::comment.comment")
            .find(sanitizedQuery);
          const sanitizedResults = await this.sanitizeOutput(results, ctx);
          return this.transformResponse(sanitizedResults, { pagination });
        }
      } catch (error: any) {
        // Handle errors in finding comments
        strapi.log.error('Error finding comments:', error);
        return ctx.badRequest('Failed to retrieve comments');
      }
    },

    // Find a specific comment
    async findOne(ctx) {
      const { id } = ctx.params;

      try {
        const sanitizedQuery = await this.sanitizeQuery(ctx);
        // Remove populate since we don't have relations anymore
        delete sanitizedQuery.populate;

        const entity = await strapi
          .service("api::comment.comment")
          .findOne(id, sanitizedQuery);
        
        if (!entity) {
          return ctx.notFound("Comment not found");
        }

        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
      } catch (error: any) {
        // Handle errors in finding single comment
        strapi.log.error('Error finding comment:', error);
        return ctx.badRequest('Failed to retrieve comment');
      }
    },

    // Create a new comment (authenticated users only)
    async create(ctx) {
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized("You must be logged in to comment");
      }

      const { data } = ctx.request.body;

      // Convert legacy format to new schema format
      const commentData: any = {
        content: data.content,
        userId: String(user.id), // Convert to string as required by schema
      };
      


      // Handle article field (legacy) - convert to contentType and contentId
      if (data.article) {
        commentData.contentType = 'comment';
        commentData.contentId = typeof data.article === 'string' ? data.article : data.article.documentId;
      } else if (data.contentType && data.contentId) {
        // New format
        commentData.contentType = data.contentType;
        commentData.contentId = data.contentId;
      } else {
        return ctx.badRequest("Article or content reference is required");
      }

      // Handle parentComment field (legacy) - convert to parentId
      if (data.parentComment) {
        if (typeof data.parentComment === 'string') {
          commentData.parentId = data.parentComment;
        } else if (data.parentComment.documentId) {
          commentData.parentId = data.parentComment.documentId;
        }
      } else if (data.parentId) {
        // New format
        commentData.parentId = data.parentId;
      }

      // Validate parentId before proceeding
      if (commentData.parentId) {
        // Basic format validation
        if (typeof commentData.parentId !== 'string' || commentData.parentId.trim().length === 0) {
          return ctx.badRequest('Parent ID must be a non-empty string');
        }

        if (commentData.parentId.length > 255) {
          return ctx.badRequest('Parent ID is too long (maximum 255 characters)');
        }

        try {
          const validation = await strapi
            .service("api::comment.comment")
            .validateParentComment(commentData.parentId, commentData.contentType, commentData.contentId);
          
          if (!validation.isValid) {
            return ctx.badRequest(validation.error || 'Invalid parent comment');
          }
        } catch (error) {
          return ctx.badRequest('Failed to validate parent comment');
        }
      }

      console.log('Final commentData:', commentData);

      try {
        console.log('Calling createComment service...');
        const entity = await strapi.service("api::comment.comment").createComment(commentData);
        
        console.log('✅ Comment created:', entity);
        
        // Return the created entity (no populate needed since we don't have relations)
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
      } catch (error: any) {
        console.log('❌ Service error:', error.message);
        console.log('Error stack:', error.stack);
        // Handle specific validation errors
        if (error.message.includes('Parent comment not found')) {
          return ctx.badRequest('The parent comment you are trying to reply to does not exist or has been deleted');
        }
        if (error.message.includes('circular reference')) {
          return ctx.badRequest('Invalid parent comment: this would create a circular reference');
        }
        if (error.message.includes('nesting depth')) {
          return ctx.badRequest('Comment nesting depth limit exceeded');
        }
        if (error.message.includes('Comment content cannot be empty')) {
          return ctx.badRequest('Comment content is required');
        }
        if (error.message.includes('Comment content cannot exceed')) {
          return ctx.badRequest('Comment content is too long (maximum 1000 characters)');
        }
        if (error.message.includes('contentType is required')) {
          return ctx.badRequest('Content type is required');
        }
        if (error.message.includes('contentId is required')) {
          return ctx.badRequest('Content ID is required');
        }
        if (error.message.includes('userId is required')) {
          return ctx.badRequest('User authentication is required');
        }
        
        // Generic error fallback
        strapi.log.error('Error creating comment:', error);
        return ctx.badRequest(error.message || 'Failed to create comment');
      }
    },

    // Update own comment (author only)
    async update(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized("You must be logged in to edit comments");
      }

      // Check if user owns the comment
      const existingComment = await strapi
        .service("api::comment.comment")
        .findOne(id);

      if (!existingComment) {
        return ctx.notFound("Comment not found");
      }

      // Check ownership using userId field instead of author relation
      if (existingComment.userId !== String(user.id)) {
        return ctx.forbidden("You can only edit your own comments");
      }

      const { data } = ctx.request.body;

      // Prepare update data
      const updateData: any = {};
      
      if (data.content !== undefined) {
        updateData.content = data.content;
      }

      // Handle parentId updates if provided
      if (data.parentId !== undefined) {
        updateData.parentId = data.parentId;
      } else if (data.parentComment !== undefined) {
        // Legacy format support
        updateData.parentId = typeof data.parentComment === 'string' 
          ? data.parentComment 
          : data.parentComment?.documentId;
      }

      try {
        const entity = await strapi.service("api::comment.comment").updateComment(id, updateData);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
      } catch (error: any) {
        // Handle specific validation errors for updates
        if (error.message.includes('Parent comment not found')) {
          return ctx.badRequest('The parent comment you are trying to set does not exist or has been deleted');
        }
        if (error.message.includes('circular reference')) {
          return ctx.badRequest('Invalid parent comment: this would create a circular reference');
        }
        if (error.message.includes('nesting depth')) {
          return ctx.badRequest('Comment nesting depth limit exceeded');
        }
        if (error.message.includes('Comment content cannot be empty')) {
          return ctx.badRequest('Comment content cannot be empty');
        }
        if (error.message.includes('Comment content cannot exceed')) {
          return ctx.badRequest('Comment content is too long (maximum 1000 characters)');
        }
        
        // Generic error fallback
        strapi.log.error('Error updating comment:', error);
        return ctx.badRequest(error.message || 'Failed to update comment');
      }
    },

    // Soft delete own comment (author only)
    async delete(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized("You must be logged in to delete comments");
      }

      // Check if user owns the comment
      const existingComment = await strapi
        .service("api::comment.comment")
        .findOne(id);

      if (!existingComment) {
        return ctx.notFound("Comment not found");
      }

      // Check ownership using userId field instead of author relation
      if (existingComment.userId !== String(user.id)) {
        return ctx.forbidden("You can only delete your own comments");
      }

      try {
        // Use the service method for deletion
        const entity = await strapi.service("api::comment.comment").deleteComment(id);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
      } catch (error: any) {
        // Handle specific deletion errors
        if (error.message.includes('Comment not found')) {
          return ctx.notFound('Comment not found');
        }
        
        // Generic error fallback
        strapi.log.error('Error deleting comment:', error);
        return ctx.badRequest(error.message || 'Failed to delete comment');
      }
    },

    // Moderate comment (moderators only)
    async moderate(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized("You must be logged in to moderate comments");
      }

      // Check if user has moderation permissions (this would need to be configured in Strapi roles)
      // For now, we'll assume any authenticated user can moderate

      const { data } = ctx.request.body;
      const { moderationStatus } = data;

      if (
        !["pending", "approved", "rejected", "flagged"].includes(
          moderationStatus
        )
      ) {
        return ctx.badRequest("Invalid moderation status");
      }

      // Note: Our new schema doesn't have moderation fields like isApproved, isFlagged, etc.
      // This would need to be added to the schema if moderation is required
      const commentData = {
        isInappropriate: moderationStatus === "flagged",
        // Add other moderation fields as needed based on schema
      };

      try {
        const entity = await strapi.service("api::comment.comment").updateComment(id, commentData);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },

    // Flag comment for moderation
    async flag(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized("You must be logged in to flag comments");
      }

      try {
        const entity = await strapi.service("api::comment.comment").flagAsInappropriate(id);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },

    // Get comments for a specific article
    async getCommentsForArticle(ctx) {
      const { articleId } = ctx.params;

      try {
        const comments = await strapi
          .service("api::comment.comment")
          .findCommentsForArticle(articleId);
        const sanitizedComments = await this.sanitizeOutput(comments, ctx);

        return this.transformResponse(sanitizedComments);
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },

    // Get pending comments for moderation
    async getPendingComments(ctx) {
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized(
          "You must be logged in to view pending comments"
        );
      }

      // Check if user has moderation permissions (this would need to be configured in Strapi roles)
      // For now, we'll assume any authenticated user can view pending comments

      try {
        // Since our schema doesn't have pending status, return empty array
        // This would need to be implemented if moderation workflow is required
        const comments: any[] = [];
        const sanitizedComments = await this.sanitizeOutput(comments, ctx);

        return this.transformResponse(sanitizedComments);
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },

    // Get flagged comments for moderation
    async getFlaggedComments(ctx) {
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized(
          "You must be logged in to view flagged comments"
        );
      }

      // Check if user has moderation permissions (this would need to be configured in Strapi roles)
      // For now, we'll assume any authenticated user can view flagged comments

      try {
        // Find comments marked as inappropriate
        const { results } = await strapi
          .service("api::comment.comment")
          .find({
            filters: {
              isInappropriate: true,
              isDeleted: false,
            },
          });
        const sanitizedComments = await this.sanitizeOutput(results, ctx);

        return this.transformResponse(sanitizedComments);
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },
  })
);
