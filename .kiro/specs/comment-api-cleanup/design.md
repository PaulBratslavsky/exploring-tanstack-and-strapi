# Design Document

## Overview

This design outlines the cleanup and optimization of the Strapi comment API. The primary goal is to remove unused moderation features and create a more efficient, purpose-built endpoint for retrieving hierarchical comments. The new design separates concerns by having a dedicated endpoint for hierarchical comment retrieval while keeping the standard REST endpoints simple and focused.

## Architecture

### Current Architecture Issues

1. **Mixed Concerns in Find Controller**: The `find` method contains conditional logic to detect specific filters and switch behavior
2. **Unused Moderation Features**: Multiple endpoints and service methods for moderation that are never called
3. **Duplicate Validation Logic**: Separate `comment-validation.js` file with validation methods that duplicate service logic
4. **Inefficient Filtering**: Client sends filters through query params that require parsing and conditional handling

### New Architecture

```
Client Application
    ↓
    ├─→ GET /api/comments/for-content/:contentId  (hierarchical comments)
    ├─→ POST /api/comments                         (create comment)
    ├─→ PUT /api/comments/:id                      (update comment)
    ├─→ DELETE /api/comments/:id                   (delete comment)
    └─→ GET /api/comments/:id                      (get single comment)
```

### Endpoint Responsibilities

- **GET /api/comments/for-content/:contentId**: Purpose-built for retrieving all comments for a content item with hierarchical structure
- **Standard REST endpoints**: Simple CRUD operations without hierarchy building
- **No moderation endpoints**: Removed entirely

## Components and Interfaces

### 1. Custom Routes (`custom-comment.ts`)

**Before:**
```typescript
{
  routes: [
    { path: '/comments/:id/moderate', ... },
    { path: '/comments/:id/flag', ... },
    { path: '/comments/pending', ... },
    { path: '/comments/flagged', ... },
    { path: '/articles/:articleId/comments', ... }
  ]
}
```

**After:**
```typescript
{
  routes: [
    {
      method: 'GET',
      path: '/comments/for-content/:contentId',
      handler: 'comment.getCommentsForContent',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
}
```

### 2. Controller Methods (`comment.ts`)

**Methods to Remove:**
- `moderate(ctx)` - Unused moderation
- `flag(ctx)` - Unused moderation
- `getPendingComments(ctx)` - Unused moderation
- `getFlaggedComments(ctx)` - Unused moderation
- `getCommentsForArticle(ctx)` - Duplicate of new endpoint

**Methods to Simplify:**
- `find(ctx)` - Remove conditional hierarchy-building logic, return to standard Strapi behavior

**Methods to Add:**
- `getCommentsForContent(ctx)` - New dedicated handler for hierarchical comments

**Methods to Retain (unchanged):**
- `findOne(ctx)` - Get single comment
- `create(ctx)` - Create comment with validation
- `update(ctx)` - Update comment with ownership check
- `delete(ctx)` - Soft delete comment with ownership check

### 3. Service Methods (`comment.ts`)

**Methods to Remove:**
- `findCommentsForArticle()` - Legacy method, replaced by findCommentsForContent
- `findCommentsForContentFlat()` - Unused
- `flagAsInappropriate()` - Unused moderation
- `unflagComment()` - Unused moderation

**Methods to Retain:**
- `buildCommentHierarchy(comments)` - Used by new endpoint
- `findCommentsForContent(contentType, contentId, options)` - Used by new endpoint
- `validateParentComment(parentId, contentType, contentId)` - Used by create/update
- `validateParentChildRelationship(commentId, parentId)` - Used by create/update
- `createComment(data)` - Used by create controller
- `updateComment(id, data)` - Used by update controller
- `deleteComment(id)` - Used by delete controller

### 4. Validation Service (`comment-validation.js`)

**Action:** Delete entire file

**Rationale:** The validation logic in this file duplicates methods already present in the main service file (`validateParentComment`, `validateParentChildRelationship`). The service methods are more integrated and easier to maintain.

## Data Models

No changes to the comment schema. The existing schema remains:

```json
{
  "content": "text",
  "contentType": "enumeration ['comment', 'content']",
  "contentId": "string",
  "userId": "string",
  "parentId": "string (nullable)",
  "isEdited": "boolean",
  "isInappropriate": "boolean",
  "isDeleted": "boolean"
}
```

## Implementation Details

### New Controller Method: `getCommentsForContent`

```typescript
async getCommentsForContent(ctx) {
  const { contentId } = ctx.params;
  
  // Validate contentId parameter
  if (!contentId) {
    return ctx.badRequest('Content ID is required');
  }

  try {
    // Call service method to get hierarchical comments
    // contentType is hardcoded to 'comment' for article comments
    const comments = await strapi
      .service("api::comment.comment")
      .findCommentsForContent('comment', contentId);
    
    const sanitizedComments = await this.sanitizeOutput(comments, ctx);
    return this.transformResponse(sanitizedComments);
  } catch (error) {
    strapi.log.error('Error fetching comments for content:', error);
    return ctx.badRequest('Failed to retrieve comments');
  }
}
```

### Simplified `find` Controller Method

Remove the conditional logic that detects `contentType` and `contentId` filters. Return to standard Strapi find behavior:

```typescript
async find(ctx) {
  const sanitizedQuery = await this.sanitizeQuery(ctx);
  
  // Add isDeleted filter to exclude deleted comments
  sanitizedQuery.filters = {
    ...sanitizedQuery.filters,
    isDeleted: false
  };

  try {
    const { results, pagination } = await strapi
      .service("api::comment.comment")
      .find(sanitizedQuery);
    
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  } catch (error) {
    strapi.log.error('Error finding comments:', error);
    return ctx.badRequest('Failed to retrieve comments');
  }
}
```

### Client-Side Changes

**Before:**
```typescript
const getCommentsForArticleInternal = async (articleDocumentId: string) => {
  return comments.find({
    filters: {
      contentType: { $eq: 'comment' },
      contentId: { $eq: articleDocumentId },
      isDeleted: { $eq: false },
    },
    sort: ['createdAt:desc'],
  }) as Promise<TCommentResponse>
}
```

**After:**
```typescript
const getCommentsForArticleInternal = async (articleDocumentId: string) => {
  const url = new URL(`/api/comments/for-content/${articleDocumentId}`, baseUrl);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json() as Promise<TCommentResponse>;
}
```

## Error Handling

### New Endpoint Error Cases

1. **Missing contentId**: Return 400 Bad Request with message "Content ID is required"
2. **Service error**: Return 400 Bad Request with message "Failed to retrieve comments"
3. **No comments found**: Return empty array (not an error)

### Existing Endpoints

Error handling remains unchanged for create, update, delete, and findOne methods.

## Testing Strategy

### Unit Tests (Optional)

If unit tests are implemented, they should cover:

1. **New endpoint**: Test that `getCommentsForContent` returns hierarchical structure
2. **Simplified find**: Test that find no longer builds hierarchy
3. **Service methods**: Test that hierarchy building still works correctly
4. **Validation**: Test that parent comment validation still works

### Integration Tests (Optional)

If integration tests are implemented, they should cover:

1. **End-to-end flow**: Client calls new endpoint and receives hierarchical comments
2. **CRUD operations**: Create, update, delete still work as expected
3. **Backward compatibility**: Existing comment functionality is preserved

### Manual Testing

1. Test new endpoint returns hierarchical comments for an article
2. Test create comment still works
3. Test update comment still works
4. Test delete comment still works
5. Test that moderation endpoints return 404 (removed)

## Migration Strategy

### Phase 1: Backend Changes
1. Create new custom route and controller method
2. Remove unused moderation endpoints and methods
3. Simplify find controller method
4. Remove validation service file
5. Remove legacy service methods

### Phase 2: Client Changes
1. Update `getCommentsForArticleInternal` to use new endpoint
2. Remove filter parameters from the call
3. Test that comments display correctly

### Phase 3: Verification
1. Verify all comment functionality works
2. Verify no console errors
3. Verify hierarchy displays correctly
4. Remove any dead code or unused imports

## Performance Considerations

### Improvements

1. **Reduced parsing overhead**: No need to parse and evaluate filters in controller
2. **Clearer intent**: Dedicated endpoint makes caching strategies easier to implement
3. **Simpler code path**: Fewer conditional branches in controller logic

### No Performance Degradation

The actual database queries and hierarchy building logic remain the same, so there should be no performance degradation. The changes are purely architectural improvements.

## Security Considerations

### Authentication

- New endpoint does not require authentication (public read access to comments)
- Create, update, delete endpoints still require authentication
- Ownership checks remain in place for update and delete

### Authorization

- No changes to authorization logic
- Users can only edit/delete their own comments
- All users can read comments

### Input Validation

- New endpoint validates that contentId parameter is provided
- Existing validation for create/update/delete remains unchanged

## Backward Compatibility

### Breaking Changes

The client must be updated to use the new endpoint. The old approach of using `find` with filters will no longer return hierarchical comments.

### Migration Path

1. Deploy backend changes first
2. Update client to use new endpoint
3. Deploy client changes
4. Verify functionality

### Rollback Plan

If issues arise:
1. Revert client changes to use old find approach
2. Revert backend changes to restore conditional logic in find method
3. Investigate and fix issues
4. Redeploy

## Future Enhancements

### Potential Improvements

1. **Pagination**: Add pagination support to the new endpoint for articles with many comments
2. **Sorting options**: Allow client to specify sort order (newest first, oldest first, etc.)
3. **Filtering**: Add optional filters for flagged/inappropriate comments (if moderation is re-added)
4. **Caching**: Implement caching strategy for frequently accessed comment threads
5. **Real-time updates**: Add WebSocket support for real-time comment updates

### Not Included in This Cleanup

- Moderation features (removed entirely)
- Comment reactions/likes
- Comment threading depth limits
- Comment editing history
