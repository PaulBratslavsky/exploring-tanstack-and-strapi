# Requirements Document

## Introduction

This feature focuses on cleaning up and optimizing the Strapi comment API by removing unused features and creating a more efficient, purpose-built endpoint for retrieving hierarchical comments.

**Current Issues:**
- The client uses the generic `GET /api/comments` endpoint with filters, which requires the controller to parse filters and conditionally call hierarchy-building logic
- Extensive unused moderation features (moderate, flag, getPendingComments, getFlaggedComments)
- Duplicate validation logic in a separate `comment-validation.js` file
- Legacy service methods that are no longer used
- Mixing concerns in the `find` controller (generic find + specific hierarchy building)

**Proposed Solution:**
Create a dedicated custom endpoint `GET /api/comments/for-content/:contentId` that is purpose-built for retrieving hierarchical comments for a specific content item. This will:
- Provide a cleaner, more explicit API contract
- Eliminate filter parsing overhead
- Separate concerns (generic find vs. hierarchical content comments)
- Make the API more maintainable and easier to understand

This cleanup will simplify the codebase, improve performance, reduce maintenance burden, and improve code clarity while preserving all functionality currently used by the client.

## Glossary

- **Comment API**: The Strapi API endpoint for managing comments (`api::comment.comment`)
- **Client Application**: The Next.js/TanStack frontend that consumes the Comment API
- **Moderation Features**: Custom endpoints and logic for flagging, moderating, and reviewing comments
- **Hierarchy Building**: Server-side logic that transforms flat comment arrays into nested structures
- **Custom Routes**: Non-standard REST endpoints defined in `custom-comment.ts`
- **Validation Service**: The `comment-validation.js` file containing parentId validation logic
- **Core CRUD Operations**: Standard create, read, update, delete operations provided by Strapi

## Requirements

### Requirement 1

**User Story:** As a developer, I want to remove unused moderation endpoints, so that the API surface is smaller and easier to maintain

#### Acceptance Criteria

1. WHEN reviewing the custom routes file, THE Comment API SHALL have all moderation-related routes removed (moderate, flag, getPendingComments, getFlaggedComments)
2. WHEN reviewing the controller file, THE Comment API SHALL have all moderation-related controller methods removed (moderate, flag, getPendingComments, getFlaggedComments)
3. WHEN reviewing the service file, THE Comment API SHALL have moderation-related service methods removed (flagAsInappropriate, unflagComment)
4. THE Comment API SHALL retain only the core CRUD operations (find, findOne, create, update, delete)

### Requirement 2

**User Story:** As a developer, I want a dedicated endpoint for retrieving hierarchical comments, so that the API is more efficient and easier to understand

#### Acceptance Criteria

1. THE Comment API SHALL have a new custom route `GET /api/comments/for-content/:contentId` created
2. WHEN the new endpoint is called, THE Comment API SHALL retrieve all non-deleted comments for the specified contentId
3. WHEN the new endpoint is called, THE Comment API SHALL build and return a hierarchical structure with replies
4. THE Comment API SHALL have a new controller method `getCommentsForContent` that handles this endpoint
5. WHEN reviewing the service file, THE Comment API SHALL retain the buildCommentHierarchy method (used by new endpoint)
6. WHEN reviewing the service file, THE Comment API SHALL retain the findCommentsForContent method (used by new endpoint)

### Requirement 3

**User Story:** As a developer, I want to remove the separate validation service file, so that validation logic is consolidated in the main service

#### Acceptance Criteria

1. THE Comment API SHALL have the `comment-validation.js` file deleted
2. WHEN reviewing the service file, THE Comment API SHALL retain the validateParentComment method for basic parent validation
3. WHEN reviewing the service file, THE Comment API SHALL retain the validateParentChildRelationship method for circular reference checks
4. THE Comment API SHALL continue to validate parentId during comment creation and updates

### Requirement 4

**User Story:** As a developer, I want to simplify the controller logic, so that each method has a single, clear responsibility

#### Acceptance Criteria

1. WHEN reviewing the find controller method, THE Comment API SHALL remove the conditional logic that detects contentType/contentId filters
2. WHEN reviewing the find controller method, THE Comment API SHALL remove the call to findCommentsForContent
3. WHEN the find method is called, THE Comment API SHALL use the standard Strapi find behavior without hierarchy building
4. WHEN reviewing the find controller method, THE Comment API SHALL remove legacy filter format conversion logic
5. WHEN reviewing the create controller method, THE Comment API SHALL retain validation and authentication logic
6. WHEN reviewing the update controller method, THE Comment API SHALL retain ownership checks and validation
7. WHEN reviewing the delete controller method, THE Comment API SHALL retain ownership checks and soft-delete logic

### Requirement 5

**User Story:** As a developer, I want to consolidate custom routes, so that only necessary custom endpoints are exposed

#### Acceptance Criteria

1. THE Comment API SHALL update the `custom-comment.ts` routes file to include only the new `for-content` endpoint
2. THE Comment API SHALL remove all moderation routes from the custom routes file
3. THE Comment API SHALL remove the legacy `/articles/:articleId/comments` route
4. THE Comment API SHALL have the custom route `GET /api/comments/for-content/:contentId` defined
5. THE Comment API SHALL retain the comment-populate middleware for standard routes

### Requirement 6

**User Story:** As a developer, I want to update the client to use the new endpoint, so that it benefits from the improved API design

#### Acceptance Criteria

1. WHEN the client needs hierarchical comments, THE Client Application SHALL call the new `GET /api/comments/for-content/:contentId` endpoint
2. WHEN the client calls the new endpoint, THE Client Application SHALL receive comments with nested replies
3. WHEN the client creates a comment, THE Client Application SHALL continue to use the standard POST endpoint
4. WHEN the client updates a comment, THE Client Application SHALL continue to use the standard PUT endpoint
5. WHEN the client deletes a comment, THE Client Application SHALL continue to use the standard DELETE endpoint
6. THE Client Application SHALL remove the contentType, contentId, and isDeleted filters from the find call

### Requirement 7

**User Story:** As a developer, I want to remove legacy service methods, so that the codebase is cleaner

#### Acceptance Criteria

1. WHEN reviewing the service file, THE Comment API SHALL have the findCommentsForArticle method removed
2. WHEN reviewing the service file, THE Comment API SHALL have the findCommentsForContentFlat method removed
3. THE Comment API SHALL retain only the service methods that are actively used by controllers
