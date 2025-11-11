# Design Document

## Overview

The article comments feature will be implemented as a new Strapi content type with corresponding React components on the frontend. The system will leverage the existing authentication infrastructure and follow the established patterns for data fetching and state management. Comments will support nested replies with a hierarchical structure displayed in chronological order (newest first), include comprehensive moderation capabilities, and provide configurable global settings for site administrators to control comment behavior across the platform. The design prioritizes user experience with immediate comment display, clear visual hierarchy for replies, and intuitive editing capabilities.

## Architecture

### Backend Architecture (Strapi) Using Strapi Version 5.27.0

The backend will consist of:
- **Comment Content Type**: A new Strapi collection type to store comment data with hierarchical relationships
- **Comment Controller**: Custom endpoints for comment operations (CRUD, moderation, flagging)
- **Comment Service**: Business logic for comment management, validation, and chronological ordering
- **Comment Routes**: API endpoints following RESTful conventions with authentication checks
- **Middleware**: Population middleware for related data (author, article, parent comments)
- **Global Settings**: Configurable system-wide comment behavior, approval workflows, and feature toggles

### Frontend Architecture (React/TanStack)

The frontend will include:
- **Comment Components**: Reusable UI components for displaying comments with chronological ordering and visual hierarchy
- **Comment Services**: Data fetching functions using the existing SDK pattern with authentication handling
- **Comment Types**: TypeScript interfaces for type safety and data validation
- **Comment Forms**: Interactive forms for creating, editing, and replying to comments with validation
- **Authentication Integration**: Seamless integration with existing auth system for user permissions

## Components and Interfaces

### Backend Components

#### Comment Content Type Schema
```json
{
  "kind": "collectionType",
  "collectionName": "comments",
  "info": {
    "singularName": "comment",
    "pluralName": "comments",
    "displayName": "Comment"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "content": {
      "type": "text",
      "required": true,
      "maxLength": 1000
    },
    "article": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::article.article"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
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
    },
    "isApproved": {
      "type": "boolean",
      "default": true
    },
    "isEdited": {
      "type": "boolean",
      "default": false
    },
    "isFlagged": {
      "type": "boolean",
      "default": false
    },
    "moderationStatus": {
      "type": "enumeration",
      "enum": ["pending", "approved", "rejected", "flagged"],
      "default": "approved"
    },
    "moderatedBy": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "moderatedAt": {
      "type": "datetime"
    },
    "isDeleted": {
      "type": "boolean",
      "default": false
    }
  }
}
```

#### Comment Controller Methods
- `find()`: Get approved comments for an article in chronological order (newest first) with hierarchical structure
- `findOne()`: Get a specific comment with replies (respecting approval status and user permissions)
- `create()`: Create a new comment (authenticated users only, immediate display if approved)
- `update()`: Update own comment (author only, marks as edited, maintains chronological position)
- `delete()`: Delete own comment and all replies (author only, with confirmation requirement)
- `moderate()`: Approve/reject/remove comments (moderators only, with audit trail)
- `flag()`: Flag comment for moderation review (authenticated users)
- `getModeration()`: Get comments pending moderation (moderators only)
- `getSettings()`: Retrieve global comment configuration settings

#### Comment Service Methods
- `findCommentsForArticle()`: Retrieve hierarchical comment structure in chronological order (newest first)
- `createComment()`: Validate content (max 1000 chars), create comment with immediate display if approved
- `updateComment()`: Update comment with edit tracking, maintain chronological position
- `deleteComment()`: Delete comment and all child replies with confirmation workflow
- `moderateComment()`: Handle approval/rejection/removal with audit trail and visibility control
- `flagComment()`: Mark comment for moderation review with notification system
- `validateCommentContent()`: Ensure comment meets length and content requirements
- `checkUserPermissions()`: Verify user can perform requested action (edit/delete own comments)
- `applyGlobalSettings()`: Apply system-wide comment configuration to operations

### Frontend Components

#### Core Comment Components
- `CommentSection`: Main container component with authentication state management
- `CommentList`: Renders comments in chronological order (newest first) with hierarchical indentation
- `CommentItem`: Individual comment display with author, timestamp, content, and edit indicator
- `CommentForm`: Form for creating new comments with validation and authentication prompts
- `CommentReply`: Reply form component for threaded discussions
- `CommentActions`: Edit/delete/reply buttons with user permission checks
- `CommentEditForm`: Inline editing form with save/cancel functionality
- `DeleteConfirmation`: Confirmation dialog for comment deletion

#### Component Hierarchy
```
CommentSection
├── AuthenticationPrompt (if not logged in)
├── CommentForm (new comment - authenticated users only)
├── EmptyState (when no comments exist)
└── CommentList (chronological order, newest first)
    └── CommentItem
        ├── CommentContent (author, timestamp, text, edit indicator)
        ├── CommentActions (reply/edit/delete based on permissions)
        ├── CommentEditForm (inline editing)
        ├── DeleteConfirmation (deletion dialog)
        └── CommentReply
            └── CommentList (nested replies with indentation)
```

## Global Comment Settings

### Settings Configuration
To address Requirement 6, the system will include a global settings configuration that allows administrators to control comment behavior system-wide:

```json
{
  "commentsEnabled": true,
  "requireApproval": false,
  "maxCommentLength": 1000,
  "nestedRepliesEnabled": true,
  "moderationEnabled": true,
  "allowEditing": true,
  "allowDeletion": true,
  "chronologicalOrder": "newest_first"
}
```

### Settings Implementation
- **Global Toggle**: Enable/disable comments across all articles
- **Approval Workflow**: Configure whether comments require moderation before display
- **Content Limits**: Set maximum character length for comments (default 1000)
- **Reply System**: Enable/disable nested reply functionality
- **User Permissions**: Control editing and deletion capabilities
- **Display Order**: Configure comment sorting (newest first by default)

### Settings Application
- Settings changes apply immediately to new comments and interactions
- Existing comments remain visible according to their original approval status
- UI components dynamically adapt based on current settings
- Authentication requirements are enforced based on settings configuration

## Data Models

### Comment Type Definition
```typescript
export type TComment = {
  id: number
  documentId: string
  content: string
  createdAt: string
  updatedAt: string
  isApproved: boolean
  isEdited: boolean
  author: {
    id: number
    username: string
    email: string
  }
  article: {
    id: number
    documentId: string
  }
  parentComment?: {
    id: number
    documentId: string
  }
  replies?: TComment[] // Sorted chronologically within each level
  replyCount?: number // For display purposes
  canEdit?: boolean // User permission flag
  canDelete?: boolean // User permission flag
}

export type TCommentCreate = {
  content: string
  article: string // documentId
  parentComment?: string // documentId for replies
}

export type TCommentUpdate = {
  content: string
}

export type TCommentSettings = {
  commentsEnabled: boolean
  requireApproval: boolean
  maxCommentLength: number
  nestedRepliesEnabled: boolean
  moderationEnabled: boolean
  allowEditing: boolean
  allowDeletion: boolean
}
```

### API Response Types
```typescript
export type TCommentResponse = TStrapiResponseCollection<TComment>
export type TCommentSingleResponse = TStrapiResponseSingle<TComment>
```

## Error Handling

### Backend Error Scenarios
- **Validation Errors**: Empty content, content exceeding 1000 characters, invalid references
- **Authentication Errors**: Unauthenticated users attempting to comment, reply, edit, or delete
- **Authorization Errors**: Users trying to edit/delete others' comments or access moderation features
- **Not Found Errors**: Invalid article or comment references, deleted parent comments
- **Settings Errors**: Comments disabled globally, replies disabled when attempting nested comments
- **Rate Limiting**: Too many comments from same user within time window

### Frontend Error Handling
- **Network Errors**: Connection issues, server unavailable with retry options
- **Validation Errors**: Real-time client-side validation with character count and error messages
- **Authentication Errors**: Show login prompt for unauthenticated users attempting to comment
- **Permission Errors**: Hide edit/delete actions for comments user doesn't own
- **Loading States**: Show loading indicators during comment submission, editing, and deletion
- **Confirmation Dialogs**: Require confirmation for destructive actions (delete comments)
- **Settings-Based UI**: Adapt interface based on global comment settings

### Error Response Format
```typescript
export type TCommentError = {
  status: number
  name: string
  message: string
  details?: {
    field?: string[]
    validation?: string[]
  }
}
```

## Testing Strategy

### Backend Testing
- **Unit Tests**: Service methods for comment CRUD operations
- **Integration Tests**: API endpoints with authentication
- **Database Tests**: Comment relationships and cascading deletes
- **Permission Tests**: Role-based access control

### Frontend Testing
- **Component Tests**: Comment display and interaction
- **Hook Tests**: Comment state management and API calls
- **Integration Tests**: Comment flow from creation to display
- **Accessibility Tests**: Keyboard navigation and screen reader support

### Test Data Scenarios
- Comments with and without replies in chronological order
- Nested comment hierarchies with proper indentation
- Comments by different users with varying permissions
- Approved vs pending moderation comments
- Edited comments with edit indicators and timestamps
- Empty comment sections with appropriate messaging
- Comments exceeding character limits for validation testing
- Authentication scenarios (logged in vs anonymous users)
- Global settings variations (comments disabled, replies disabled, etc.)

## Security Considerations

### Authentication & Authorization
- Comment creation, editing, and replies require authenticated users
- Users can only edit/delete their own comments (ownership validation)
- Moderators can manage all comments with full CRUD permissions
- Anonymous users can view approved comments but cannot interact
- Rate limiting to prevent spam and abuse
- Session-based authentication integration with existing auth system

### Data Validation
- Server-side content validation (non-empty, max 1000 characters)
- Client-side real-time validation with character counting
- XSS prevention through content escaping and sanitization
- SQL injection prevention through Strapi ORM
- Input length limits enforced on both client and server
- Content sanitization to prevent malicious script injection

### Privacy & Moderation
- Comment approval workflow configurable through global settings
- Hard delete for comments and all replies when user deletes
- Comment flagging system for community moderation
- Audit trail for all moderation actions with timestamps
- Moderator-only interfaces for comment management
- Public visibility controls based on approval status

## Performance Considerations

### Database Optimization
- Indexes on article_id, parent_comment_id, and createdAt for chronological sorting
- Pagination for large comment threads with newest-first ordering
- Efficient queries for nested comment retrieval with proper joins
- Optimized queries to minimize N+1 problems in hierarchical data
- Database-level sorting to ensure consistent chronological order

### Frontend Optimization
- Immediate display of comments after successful submission
- Optimistic updates for editing and deletion operations
- Efficient re-rendering when comments are added or modified
- Proper state management to maintain chronological order
- Loading states for all async operations (create, edit, delete)
- Responsive design for comment indentation and mobile viewing

### Caching Strategy
- Server-side caching for comment counts
- Client-side caching of comment data
- Cache invalidation on comment updates
- CDN caching for static comment content