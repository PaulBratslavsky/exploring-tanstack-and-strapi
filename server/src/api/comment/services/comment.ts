/**
 * comment service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::comment.comment', ({ strapi }) => ({
  /**
   * Build hierarchical comment structure from flat array
   * @param comments - Flat array of comments
   * @returns Nested comment structure with replies
   */
  buildCommentHierarchy(comments: any[]): any[] {
    if (!comments || comments.length === 0) {
      return [];
    }

    // Create a map for quick lookup by documentId
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map and initialize replies array
    comments.forEach(comment => {
      commentMap.set(comment.documentId, {
        ...comment,
        replies: []
      });
    });

    // Second pass: build hierarchy
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.documentId);
      
      if (comment.parentId) {
        // This is a reply - add to parent's replies array
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        } else {
          // Parent not found in current dataset - treat as root comment
          // This handles edge cases where parent might be deleted or not loaded
          rootComments.push(commentWithReplies);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies);
      }
    });

    // Sort root comments by creation date (newest first)
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Recursively sort replies by creation date (oldest first for better conversation flow)
    const sortReplies = (comment: any) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        comment.replies.forEach(sortReplies);
      }
    };

    rootComments.forEach(sortReplies);

    return rootComments;
  },

  /**
   * Validate that parent comment exists and is accessible
   * @param parentId - The documentId of the parent comment
   * @param contentType - The contentType of the current comment
   * @param contentId - The contentId of the current comment
   * @returns Promise resolving to validation result
   */
  async validateParentComment(parentId: string, contentType?: string, contentId?: string): Promise<{ isValid: boolean; error?: string }> {
    if (!parentId) {
      return { isValid: true };
    }

    try {
      const parentComment = await strapi.entityService.findMany('api::comment.comment', {
        filters: {
          documentId: parentId,
          isDeleted: false
        },
        limit: 1
      });

      if (!parentComment || parentComment.length === 0) {
        return { 
          isValid: false, 
          error: 'Parent comment not found or has been deleted' 
        };
      }

      // Validate that parent comment belongs to the same content item
      if (contentType && contentId) {
        const parent = parentComment[0];
        if (parent.contentType !== contentType || parent.contentId !== contentId) {
          return {
            isValid: false,
            error: 'Cannot reply to a comment from a different content item'
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      strapi.log.error('Error validating parent comment:', error);
      return { 
        isValid: false, 
        error: 'Failed to validate parent comment' 
      };
    }
  },

  /**
   * Helper method for parent-child relationship validation
   * @param commentId - The comment's documentId
   * @param parentId - The proposed parentId
   * @returns Promise resolving to validation result
   */
  async validateParentChildRelationship(commentId: string, parentId: string): Promise<{ isValid: boolean; error?: string }> {
    if (!parentId) {
      return { isValid: true };
    }

    // First validate that parent exists
    const parentValidation = await this.validateParentComment(parentId);
    if (!parentValidation.isValid) {
      return parentValidation;
    }

    // Check for circular references
    if (commentId === parentId) {
      return { 
        isValid: false, 
        error: 'A comment cannot be its own parent' 
      };
    }

    // Check if parentId is a descendant of commentId (would create circular reference)
    if (commentId) {
      try {
        let currentParentId = parentId;
        const visited = new Set();
        const maxDepth = 50; // Prevent infinite loops
        let depth = 0;

        while (currentParentId && depth < maxDepth) {
          if (visited.has(currentParentId)) {
            return { 
              isValid: false, 
              error: 'Circular reference detected in comment hierarchy' 
            };
          }

          if (currentParentId === commentId) {
            return { 
              isValid: false, 
              error: 'Cannot create circular reference: parent is a descendant of this comment' 
            };
          }

          visited.add(currentParentId);

          // Get the parent's parent
          const parentComment = await strapi.entityService.findMany('api::comment.comment', {
            filters: {
              documentId: currentParentId,
              isDeleted: false
            },
            fields: ['parentId'],
            limit: 1
          });

          if (!parentComment || parentComment.length === 0) {
            break;
          }

          currentParentId = parentComment[0].parentId;
          depth++;
        }

        if (depth >= maxDepth) {
          return { 
            isValid: false, 
            error: 'Comment hierarchy too deep or circular reference detected' 
          };
        }
      } catch (error) {
        strapi.log.error('Error checking circular reference:', error);
        return { 
          isValid: false, 
          error: 'Failed to validate comment hierarchy' 
        };
      }
    }

    // Validate nesting depth
    try {
      let currentParentId = parentId;
      let depth = 1;
      const maxNestingDepth = 5;

      while (currentParentId && depth <= maxNestingDepth) {
        const parentComment = await strapi.entityService.findMany('api::comment.comment', {
          filters: {
            documentId: currentParentId,
            isDeleted: false
          },
          fields: ['parentId'],
          limit: 1
        });

        if (!parentComment || parentComment.length === 0) {
          break;
        }

        currentParentId = parentComment[0].parentId;
        if (currentParentId) {
          depth++;
        }
      }

      if (depth > maxNestingDepth) {
        return { 
          isValid: false, 
          error: `Comment nesting depth cannot exceed ${maxNestingDepth} levels`
        };
      }
    } catch (error) {
      strapi.log.error('Error validating nesting depth:', error);
      return { 
        isValid: false, 
        error: 'Failed to validate comment nesting depth' 
      };
    }

    return { isValid: true };
  },

  // Find comments for specific content with hierarchical structure
  async findCommentsForContent(contentType: string, contentId: string, options = {}) {
    // Get ALL comments for the content (both top-level and replies) in a single query
    const allCommentsOptions = {
      // No populate needed - userId is a simple string field
      sort: { createdAt: 'desc' } as any,
      ...options,
      // Ensure filters are not overridden by options
      filters: {
        contentType,
        contentId,
        isDeleted: false,
      },
    };

    const allComments = await strapi.entityService.findMany('api::comment.comment', allCommentsOptions as any);

    // Build hierarchical structure from flat array
    return this.buildCommentHierarchy(allComments);
  },

  // Legacy method for backward compatibility
  async findCommentsForArticle(articleId: string, options = {}) {
    return this.findCommentsForContent('comment', articleId, options);
  },

  /**
   * Find all comments for content in flat structure (no hierarchy)
   * Useful for admin interfaces or when hierarchy building is not needed
   */
  async findCommentsForContentFlat(contentType: string, contentId: string, options = {}) {
    const allCommentsOptions = {
      filters: {
        contentType,
        contentId,
        isDeleted: false,
      },
      sort: { createdAt: 'desc' } as any,
      ...options
    };

    return await strapi.entityService.findMany('api::comment.comment', allCommentsOptions as any);
  },



  // Create a new comment with validation
  async createComment(data: any) {
    // Validate content
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    if (data.content.length > 1000) {
      throw new Error('Comment content cannot exceed 1000 characters');
    }

    // Validate contentType and contentId
    if (!data.contentType) {
      throw new Error('contentType is required');
    }

    if (!['comment', 'content'].includes(data.contentType)) {
      throw new Error('contentType must be either "comment" or "content"');
    }

    if (!data.contentId) {
      throw new Error('contentId is required');
    }

    // Validate userId
    if (!data.userId) {
      throw new Error('userId is required');
    }

    // Support legacy article field for backward compatibility
    if (data.article && !data.contentId) {
      data.contentType = 'comment';
      data.contentId = data.article;
    }

    // Support legacy author field for backward compatibility
    if (data.author && !data.userId) {
      data.userId = data.author;
    }

    // Handle parentId assignment and validation
    let parentId = data.parentId;
    
    // Support legacy parentComment field for backward compatibility
    if (data.parentComment && !parentId) {
      // Convert parentComment relation to parentId
      if (typeof data.parentComment === 'object' && data.parentComment.documentId) {
        // If parentComment is an object with documentId
        parentId = data.parentComment.documentId;
      } else if (typeof data.parentComment === 'string') {
        // If parentComment is a string (documentId or id)
        const parentComment = await strapi.entityService.findOne('api::comment.comment', data.parentComment);
        if (!parentComment) {
          throw new Error('Parent comment not found');
        }
        if (parentComment.isDeleted) {
          throw new Error('Cannot reply to deleted comment');
        }
        parentId = parentComment.documentId;
      } else {
        // If parentComment is a numeric ID, find by ID
        const parentComment = await strapi.entityService.findOne('api::comment.comment', data.parentComment);
        if (!parentComment) {
          throw new Error('Parent comment not found');
        }
        if (parentComment.isDeleted) {
          throw new Error('Cannot reply to deleted comment');
        }
        parentId = parentComment.documentId;
      }
    }

    // Validate parentId if provided using new validation methods
    if (parentId) {
      const parentValidation = await this.validateParentComment(parentId, data.contentType, data.contentId);
      if (!parentValidation.isValid) {
        throw new Error(parentValidation.error);
      }

      // Additional comprehensive validation (circular references, depth, etc.)
      const relationshipValidation = await this.validateParentChildRelationship(null, parentId);
      if (!relationshipValidation.isValid) {
        throw new Error(relationshipValidation.error);
      }
    }

    // Create the comment with parentId
    const commentData = {
      content: data.content.trim(),
      contentType: data.contentType,
      contentId: data.contentId,
      userId: data.userId,
      parentId: parentId || null
    };

    try {
      // Use db.query to avoid audit field issues with regular users
      // The created_by_id and updated_by_id fields reference admin_users, not regular users
      const result = await strapi.db.query('api::comment.comment').create({
        data: {
          ...commentData,
          // Explicitly set audit fields to null - regular users don't set these
          createdBy: null,
          updatedBy: null
        }
      });
      return result;
    } catch (error) {
      
      // Fallback to entity service with explicit audit field handling
      try {
        const result = await strapi.entityService.create('api::comment.comment', {
          data: {
            ...commentData,
            // Explicitly set audit fields to null to avoid foreign key constraint issues
            // Regular users should not set these fields - they reference admin_users table
            createdBy: null,
            updatedBy: null
          }
        });
        return result;
      } catch (entityError) {
        throw entityError;
      }
    }
  },

  // Update comment with validation
  async updateComment(id: string | number, data: any) {
    // Validate content if provided
    if (data.content !== undefined) {
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Comment content cannot be empty');
      }

      if (data.content.length > 1000) {
        throw new Error('Comment content cannot exceed 1000 characters');
      }
      
      // Trim content
      data.content = data.content.trim();
    }

    // Validate parentId if being updated
    if (data.parentId !== undefined) {
      const comment = await strapi.entityService.findOne('api::comment.comment', id);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Validate parent comment exists and is accessible
      if (data.parentId) {
        const parentValidation = await this.validateParentComment(data.parentId, comment.contentType, comment.contentId);
        if (!parentValidation.isValid) {
          throw new Error(parentValidation.error);
        }

        // Validate parent-child relationship (circular references, depth, etc.)
        const relationshipValidation = await this.validateParentChildRelationship(comment.documentId, data.parentId);
        if (!relationshipValidation.isValid) {
          throw new Error(relationshipValidation.error);
        }
      }
    }

    const updateData = {
      ...data,
      isEdited: data.content !== undefined ? true : undefined
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return await strapi.entityService.update('api::comment.comment', id, {
      data: updateData
    });
  },

  // Soft delete comment and handle replies
  async deleteComment(id: string | number) {
    const comment = await strapi.entityService.findOne('api::comment.comment', id);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Get replies using parentId
    const replies = await strapi.entityService.findMany('api::comment.comment', {
      filters: {
        parentId: comment.documentId,
        isDeleted: false
      }
    } as any);

    // Soft delete the comment
    await strapi.entityService.update('api::comment.comment', id, {
      data: { isDeleted: true }
    });

    // Handle replies - they remain visible but show parent as deleted
    return {
      ...comment,
      replies
    };
  },

  // Flag comment as inappropriate
  async flagAsInappropriate(id: string | number) {
    return await strapi.entityService.update('api::comment.comment', id, {
      data: {
        isInappropriate: true
      }
    });
  },

  // Unflag comment (mark as appropriate)
  async unflagComment(id: string | number) {
    return await strapi.entityService.update('api::comment.comment', id, {
      data: {
        isInappropriate: false
      }
    });
  }
}));