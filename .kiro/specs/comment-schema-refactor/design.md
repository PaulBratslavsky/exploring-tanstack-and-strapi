# Design Document

## Overview

This design outlines the refactoring of the comment system from using Strapi's bidirectional relations (`parentComment` and `replies`) to a simplified approach using a `parentId` string field. This change will maintain the same nested comment functionality while simplifying the data model, improving performance, and making the system more flexible.

## Architecture

### Current Architecture

- Uses Strapi's `manyToOne` and `oneToMany` relations
- Automatic bidirectional relationship management
- Complex populate queries with nested relations
- Frontend builds hierarchy from pre-populated `replies` arrays

### New Architecture

- Simple `parentId` string field referencing parent comment's `documentId`
- Manual hierarchy construction in service layer
- Flattened database queries with post-processing
- Frontend receives the same hierarchical structure

## Components and Interfaces

### 1. Schema Changes

**Current Schema:**

```json
{
  "parentComment": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::comment.comment"
  },
  "replies": {
    "type": "relation",
    "relation": "oneToMany",
    "target": "api::comment.comment",
    "mappedBy": "parentComment"
  }
}
```

**New Schema:**

```json
{
  "parentId": {
    "type": "string",
    "required": false,
    "maxLength": 255
  }
}
```

### 2. Service Layer Changes

**Comment Service Enhancements:**

- `buildCommentHierarchy()` - Constructs nested structure from flat array
- `validateParentComment()` - Ensures parent exists and is not deleted
- `findCommentsForArticle()` - Modified to use parentId filtering
- Migration utilities for data conversion

**Key Methods:**

```typescript
// Build hierarchy from flat comment array
buildCommentHierarchy(comments: TComment[]): TComment[]

// Validate parent comment exists and is accessible
validateParentComment(parentId: string): Promise<boolean>

// Find all comments for article with efficient querying
findCommentsForArticleFlat(articleId: string): Promise<TComment[]>
```

### 3. Controller Layer Changes

**Modified Endpoints:**

- `POST /comments` - Accept `parentId` instead of `parentComment`
- `GET /comments` - Return flattened data, build hierarchy in service
- `PUT /comments/:id` - Handle parentId updates if needed

**Request/Response Format:**

```typescript
// Request format (unchanged for frontend compatibility)
{
  "data": {
    "content": "Comment text",
    "article": "article-document-id",
    "parentComment": "parent-comment-document-id" // Maps to parentId internally
  }
}

// Response format (unchanged - hierarchy maintained)
{
  "data": {
    "id": 1,
    "documentId": "comment-doc-id",
    "content": "Comment text",
    "parentId": "parent-doc-id",
    "replies": [...] // Built by service layer
  }
}
```

### 4. Frontend Changes

**Minimal Frontend Impact:**

- Comment types remain unchanged
- `buildCommentHierarchy()` logic moves from frontend to backend
- API calls remain the same
- Component structure unchanged

## Data Models

### Comment Model (Updated)

```typescript
type TComment = {
  id: number;
  documentId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isApproved: boolean;
  isEdited: boolean;
  isFlagged: boolean;
  moderationStatus: "pending" | "approved" | "rejected" | "flagged";
  isDeleted: boolean;
  parentId?: string | null; // New field - documentId of parent comment
  author?: {
    id: number;
    username: string;
    email: string;
  };
  article?: {
    id: number;
    documentId: string;
  };
  replies?: TComment[]; // Still populated by service layer
};
```

### Migration Data Structure

```typescript
type MigrationRecord = {
  commentId: number;
  documentId: string;
  oldParentCommentId: number | null;
  newParentId: string | null;
  migrationStatus: "pending" | "completed" | "failed";
  errorMessage?: string;
};
```

## Error Handling

### Validation Errors

- **Invalid Parent ID**: Return 400 with message "Parent comment not found"
- **Circular Reference**: Prevent comment from being its own parent
- **Deleted Parent**: Prevent replies to deleted comments
- **Deep Nesting**: Optional limit on nesting depth (e.g., 5 levels)

### Migration Errors

- **Orphaned Comments**: Handle comments with invalid parent references
- **Data Integrity**: Ensure all relationships are preserved during migration
- **Rollback Strategy**: Maintain backup of original relation data

### Runtime Errors

- **Hierarchy Building**: Graceful handling of malformed parent relationships
- **Performance**: Timeout protection for large comment trees
- **Memory**: Efficient processing of large comment datasets

## Testing Strategy

### Unit Tests

- Schema validation for parentId field
- Comment service hierarchy building logic
- Parent comment validation methods
- Migration utility functions

### Integration Tests

- End-to-end comment creation with parentId
- Nested comment retrieval and hierarchy construction
- Comment deletion and orphan handling
- API endpoint compatibility with existing frontend

### Migration Tests

- Data preservation during schema migration
- Performance testing with large comment datasets
- Rollback procedure validation
- Edge case handling (orphaned comments, circular refs)

### Performance Tests

- Query performance comparison (before/after)
- Memory usage during hierarchy construction
- Response time for deeply nested comment trees
- Concurrent comment creation stress testing

## Implementation Phases

### Phase 1: Schema Migration

1. Add `parentId` field to comment schema
2. Create migration script to populate parentId from existing relations
3. Validate data integrity post-migration
4. Keep old relation fields temporarily for rollback

### Phase 2: Service Layer Updates

1. Implement `buildCommentHierarchy()` method
2. Update `findCommentsForArticle()` to use parentId
3. Modify comment creation/update logic
4. Add parentId validation methods

### Phase 3: Controller Updates

1. Update controllers to use new service methods
2. Maintain API compatibility for frontend
3. Add error handling for parentId validation
4. Update populate logic to remove old relations

### Phase 4: Cleanup

1. Remove old relation fields from schema
2. Update documentation and type definitions
3. Performance optimization and monitoring
4. Frontend cleanup (remove client-side hierarchy building)

## Performance Considerations

### Query Optimization

- Single query to fetch all comments for an article
- In-memory hierarchy construction (faster than nested DB queries)
- Indexed parentId field for efficient filtering
- Pagination support for large comment threads

### Memory Management

- Efficient hierarchy building algorithm (O(n) complexity)
- Streaming processing for very large comment sets
- Garbage collection friendly data structures
- Optional comment tree depth limits

### Caching Strategy

- Cache built hierarchies for frequently accessed articles
- Invalidate cache on comment creation/updates
- Consider Redis for distributed caching
- Cache warming for popular articles

## Security Considerations

### Data Validation

- Strict parentId format validation (documentId format)
- Prevent circular reference attacks
- Validate parent comment ownership/permissions
- Rate limiting on comment creation

### Access Control

- Maintain existing comment moderation features
- Ensure parentId references don't leak private data
- Validate user permissions for parent comment access
- Audit trail for parentId changes

## Rollback Strategy

### Migration Rollback

1. Restore original relation fields from backup
2. Remove parentId field
3. Revert service layer changes
4. Validate comment hierarchy integrity

### Emergency Procedures

- Database backup before migration
- Feature flag to switch between old/new logic
- Monitoring alerts for hierarchy building failures
- Quick rollback scripts for production issues
