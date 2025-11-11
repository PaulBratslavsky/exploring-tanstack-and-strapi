/**
 * Comment validation utilities for parentId field
 */

'use strict';

module.exports = {
  /**
   * Validate parentId field format and constraints
   * @param {string} parentId - The parentId to validate
   * @param {object} strapi - Strapi instance
   * @returns {Promise<{isValid: boolean, error?: string}>}
   */
  async validateParentId(parentId, strapi) {
    // If parentId is null or undefined, it's valid (top-level comment)
    if (parentId === null || parentId === undefined) {
      return { isValid: true };
    }

    // Check format - should be a non-empty string with max length 255
    if (typeof parentId !== 'string') {
      return { 
        isValid: false, 
        error: 'parentId must be a string' 
      };
    }

    if (parentId.length === 0) {
      return { 
        isValid: false, 
        error: 'parentId cannot be empty' 
      };
    }

    if (parentId.length > 255) {
      return { 
        isValid: false, 
        error: 'parentId cannot exceed 255 characters' 
      };
    }

    // Validate that parent comment exists and is not deleted
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

      return { isValid: true };
      
    } catch (error) {
      strapi.log.error('Error validating parentId:', error);
      return { 
        isValid: false, 
        error: 'Failed to validate parent comment' 
      };
    }
  },

  /**
   * Prevent circular references in comment hierarchy
   * @param {string} commentId - The comment's documentId
   * @param {string} parentId - The proposed parentId
   * @param {object} strapi - Strapi instance
   * @returns {Promise<{isValid: boolean, error?: string}>}
   */
  async validateNoCircularReference(commentId, parentId, strapi) {
    if (!parentId || !commentId) {
      return { isValid: true };
    }

    // A comment cannot be its own parent
    if (commentId === parentId) {
      return { 
        isValid: false, 
        error: 'A comment cannot be its own parent' 
      };
    }

    // Check if parentId is a descendant of commentId (would create circular reference)
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

      return { isValid: true };
      
    } catch (error) {
      strapi.log.error('Error checking circular reference:', error);
      return { 
        isValid: false, 
        error: 'Failed to validate comment hierarchy' 
      };
    }
  },

  /**
   * Validate comment nesting depth
   * @param {string} parentId - The parentId to check depth for
   * @param {object} strapi - Strapi instance
   * @param {number} maxDepth - Maximum allowed nesting depth (default: 5)
   * @returns {Promise<{isValid: boolean, error?: string, depth?: number}>}
   */
  async validateNestingDepth(parentId, strapi, maxDepth = 5) {
    if (!parentId) {
      return { isValid: true, depth: 0 };
    }

    try {
      let currentParentId = parentId;
      let depth = 1;

      while (currentParentId && depth <= maxDepth) {
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

      if (depth > maxDepth) {
        return { 
          isValid: false, 
          error: `Comment nesting depth cannot exceed ${maxDepth} levels`,
          depth 
        };
      }

      return { isValid: true, depth };
      
    } catch (error) {
      strapi.log.error('Error validating nesting depth:', error);
      return { 
        isValid: false, 
        error: 'Failed to validate comment nesting depth' 
      };
    }
  },

  /**
   * Comprehensive validation for parentId
   * @param {string} commentId - The comment's documentId (for circular reference check)
   * @param {string} parentId - The parentId to validate
   * @param {object} strapi - Strapi instance
   * @returns {Promise<{isValid: boolean, error?: string}>}
   */
  async validateParentIdComprehensive(commentId, parentId, strapi) {
    // Basic format validation
    const formatValidation = await this.validateParentId(parentId, strapi);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // Skip further validation if parentId is null (top-level comment)
    if (!parentId) {
      return { isValid: true };
    }

    // Circular reference validation
    const circularValidation = await this.validateNoCircularReference(commentId, parentId, strapi);
    if (!circularValidation.isValid) {
      return circularValidation;
    }

    // Nesting depth validation
    const depthValidation = await this.validateNestingDepth(parentId, strapi);
    if (!depthValidation.isValid) {
      return depthValidation;
    }

    return { isValid: true };
  }
};