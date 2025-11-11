# Implementation Plan

- [x] 1. Create Comment content type and backend structure using Strapi 5 patterns

  - Create comment schema.json with all required fields and relationships
  - Set up comment controller with CRUD methods
  - Implement comment service with business logic
  - Configure comment routes for API endpoints
  - Add population middleware for comment relationships
  - Fix TypeScript compilation errors
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1_

- [x] 2. Implement comment data fetching and types

  - [x] 2.1 Add comment TypeScript types to client types

    - Define TComment, TCommentCreate, TCommentUpdate interfaces
    - Add comment response types following existing patterns
    - _Requirements: 1.1, 1.5, 2.1_

  - [x] 2.2 Create comment server functions for data fetching
    - Implement getCommentsForArticle server function
    - Add createComment server function with authentication
    - Create updateComment and deleteComment server functions
    - _Requirements: 1.1, 2.1, 2.4, 4.2, 4.4_

- [x] 3. Build core comment display components

  - [x] 3.1 Create CommentItem component for individual comment display

    - Display comment content, author, and timestamp
    - Show edit indicator for edited comments
    - Handle nested reply indentation
    - _Requirements: 1.5, 4.3_

  - [x] 3.2 Create CommentList component for comment hierarchy

    - Render comments in chronological order
    - Handle nested replies with proper indentation
    - Display "no comments" message when empty
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.3 Create CommentSection container component
    - Integrate comment list and form components
    - Handle loading and error states
    - Manage comment data fetching for articles
    - _Requirements: 1.1, 2.1_

- [x] 4. Implement comment creation and editing

  - [x] 4.1 Create CommentForm component for new comments

    - Build form with content validation (max 1000 characters)
    - Show authentication prompt for unauthenticated users
    - Handle form submission with error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.2 Add comment editing functionality

    - Create inline edit form for comment updates
    - Add edit/delete action buttons for comment authors
    - Implement optimistic updates for better UX
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.3 Implement comment deletion with confirmation
    - Add delete confirmation dialog
    - Handle comment removal and reply management
    - Update UI after successful deletion
    - _Requirements: 4.1, 4.4, 4.5_

- [x] 5. Build reply system for threaded discussions

  - [x] 5.1 Create CommentReply component

    - Add reply button to each comment
    - Show reply form when activated
    - Handle reply submission as child comments
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Implement nested comment rendering
    - Display replies with visual indentation
    - Maintain chronological order within reply threads
    - Handle multiple levels of nesting
    - _Requirements: 3.4, 3.5_

- [x] 6. Add comment actions and user permissions

  - [x] 6.1 Create CommentActions component

    - Show edit/delete buttons only for comment authors
    - Add reply button for all authenticated users
    - Handle action button states and permissions
    - _Requirements: 4.1, 3.1_

  - [x] 6.2 Implement user authentication checks
    - Verify user ownership for edit/delete actions
    - Show appropriate UI based on authentication status
    - Handle authentication errors gracefully
    - _Requirements: 2.2, 4.1_

- [x] 7. Integrate comments into article pages

  - [x] 7.1 Add CommentSection to article detail page

    - Import and render CommentSection component
    - Pass article data to comment system
    - Position comments below article content
    - _Requirements: 1.1_

  - [x] 7.2 Handle comment data loading and error states
    - Implement loading indicators for comment operations
    - Add error handling for failed comment operations
    - Show appropriate feedback messages to users
    - _Requirements: 2.5_

- [ ]\* 8. Add comprehensive testing for comment system

  - [ ]\* 8.1 Write unit tests for comment components

    - Test CommentItem rendering and interactions
    - Test CommentForm validation and submission
    - Test CommentList hierarchy and sorting
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ]\* 8.2 Write integration tests for comment workflows

    - Test complete comment creation flow
    - Test reply and edit workflows
    - Test authentication and permission scenarios
    - _Requirements: 2.4, 3.3, 4.2_

  - [ ]\* 8.3 Add backend API tests for comment endpoints
    - Test comment CRUD operations
    - Test authentication and authorization
    - Test comment relationships and cascading
    - _Requirements: 2.4, 4.4, 4.5_
