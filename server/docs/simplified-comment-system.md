# Simplified Comment System

## Overview

The comment system has been simplified to remove complex moderation workflows while maintaining essential functionality for a tutorial-friendly codebase.

## Schema Structure

### Comment Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `content` | text | Comment content (max 1000 chars) | required |
| `contentType` | enum | Type of content being commented on | required |
| `contentId` | string | Document ID of the content | required |
| `userId` | string | User document ID | required |
| `parentId` | string | Parent comment ID for replies | null |
| `isEdited` | boolean | Whether comment was edited | false |
| `isInappropriate` | boolean | Simple flag for inappropriate content | false |
| `isDeleted` | boolean | Soft delete flag | false |

### Content Types

The `contentType` field supports:
- `comment` - Comments on articles or other commentable content
- `content` - Comments on any other content type

### Removed Fields

The following fields were removed for simplicity:
- `isApproved` (moderation)
- `isFlagged` (moderation)
- `moderationStatus` (moderation)
- `moderatedBy` (moderation)
- `moderatedAt` (moderation)
- `article` (replaced with generic contentType/contentId)
- `author` (replaced with simple userId string)

## Key Features

### ✅ Hierarchical Comments
- Uses `parentId` field to create comment threads
- Supports nested replies up to 3 levels deep
- Simple parent-child relationship

### ✅ Simple Content Flagging
- Single `isInappropriate` boolean flag
- Easy to flag/unflag content
- No complex moderation workflow

### ✅ Soft Delete
- Comments are soft deleted (not permanently removed)
- Maintains thread integrity
- Replies remain visible when parent is deleted

### ✅ Edit Tracking
- `isEdited` flag tracks if content was modified
- Simple boolean approach

## API Methods

### Core Methods
- `findCommentsForContent(contentType, contentId)` - Get hierarchical comments for any content
- `findCommentsForArticle(articleId)` - Legacy method for articles (calls findCommentsForContent)
- `getRepliesForComment(commentId)` - Get replies for a specific comment
- `createComment(data)` - Create new comment with validation
- `updateComment(id, data)` - Update comment content
- `deleteComment(id)` - Soft delete comment

### Flagging Methods
- `flagAsInappropriate(id)` - Mark comment as inappropriate
- `unflagComment(id)` - Remove inappropriate flag

## Validation

### Content Validation
- Required content field
- Maximum 1000 characters
- No empty content allowed

### Content Type Validation
- Required contentType field (must be 'article' or 'content')
- Required contentId field (max 255 chars)
- Generic approach supports any content type

### Parent ID Validation
- Validates parent comment exists
- Prevents circular references
- Enforces nesting depth limits
- Format validation (string, max 255 chars)

## Database Structure

```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  document_id VARCHAR(255),
  content TEXT NOT NULL,
  content_type VARCHAR(255) NOT NULL,
  content_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  parent_id VARCHAR(255),
  is_edited BOOLEAN DEFAULT FALSE,
  is_inappropriate BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME
  -- No relation tables needed!
);
```

## Benefits of Simplified Approach

1. **Tutorial Friendly**: Easy to understand and implement
2. **Reduced Complexity**: No complex moderation workflows
3. **Essential Features**: Maintains core commenting functionality
4. **Simple Flagging**: Boolean flag for inappropriate content
5. **Hierarchical Structure**: Supports threaded conversations
6. **Generic Content Support**: Works with any content type
7. **No Relations**: Simple string fields instead of complex relations
8. **No Relation Tables**: Clean database structure
9. **Data Integrity**: Proper validation and constraints

## Usage Examples

### Create Top-Level Comment on Article
```javascript
await strapi.service('api::comment.comment').createComment({
  content: 'Great article!',
  contentType: 'comment',
  contentId: 'article-document-id',
  userId: 'user-document-id'
});
```

### Create Comment on Any Content
```javascript
await strapi.service('api::comment.comment').createComment({
  content: 'Interesting content!',
  contentType: 'content',
  contentId: 'content-document-id',
  userId: 'user-document-id'
});
```

### Create Reply
```javascript
await strapi.service('api::comment.comment').createComment({
  content: 'I agree!',
  contentType: 'comment',
  contentId: 'article-document-id', 
  userId: 'user-document-id',
  parentId: 'parent-comment-document-id'
});
```

### Flag as Inappropriate
```javascript
await strapi.service('api::comment.comment').flagAsInappropriate('comment-id');
```

### Get Comments for Any Content
```javascript
const comments = await strapi.service('api::comment.comment')
  .findCommentsForContent('comment', 'article-document-id');
```

### Get Article Comments (Legacy)
```javascript
const comments = await strapi.service('api::comment.comment')
  .findCommentsForArticle('article-document-id');
```

This simplified system provides all essential commenting features while being easy to understand and maintain for tutorial purposes.