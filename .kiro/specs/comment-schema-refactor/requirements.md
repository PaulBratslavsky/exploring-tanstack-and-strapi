# Requirements Document

## Introduction

This feature involves refactoring the comment system to use a simplified schema approach. Instead of using Strapi's complex bidirectional relations (`parentComment` and `replies`), we will implement a simpler approach using a `parentId` string field that references the parent comment's ID. This will maintain the nested comment structure while simplifying the data model and making it more flexible for frontend rendering.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to simplify the comment schema by replacing complex relations with a simple parentId field, so that the data model is easier to work with and more performant.

#### Acceptance Criteria

1. WHEN the comment schema is updated THEN the system SHALL remove the `parentComment` and `replies` relation fields
2. WHEN the comment schema is updated THEN the system SHALL add a `parentId` string field that can be null for top-level comments
3. WHEN a comment has a parentId THEN the system SHALL validate that the referenced parent comment exists
4. WHEN querying comments THEN the system SHALL still be able to construct the nested comment tree structure

### Requirement 2

**User Story:** As a user, I want the comment functionality to work exactly the same as before, so that I don't notice any difference in how I interact with comments.

#### Acceptance Criteria

1. WHEN I view an article THEN the system SHALL display comments in the same nested structure as before
2. WHEN I reply to a comment THEN the system SHALL create a new comment with the correct parentId
3. WHEN I edit or delete a comment THEN the system SHALL maintain the same functionality as before
4. WHEN comments are loaded THEN the system SHALL build the nested structure from the parentId relationships

### Requirement 3

**User Story:** As a developer, I want the backend API to continue working with the existing frontend code, so that the refactoring doesn't break the current implementation.

#### Acceptance Criteria

1. WHEN the API returns comments THEN the system SHALL maintain the same response structure expected by the frontend
2. WHEN creating or updating comments THEN the system SHALL handle parentId assignment correctly
3. WHEN the schema migration runs THEN the system SHALL preserve existing comment relationships by converting them to parentId values
4. WHEN querying comments THEN the system SHALL efficiently build nested structures without N+1 query problems

### Requirement 4

**User Story:** As a system administrator, I want the migration to be safe and reversible, so that I can confidently deploy this change without risk of data loss.

#### Acceptance Criteria

1. WHEN the migration runs THEN the system SHALL backup existing comment relationship data
2. WHEN converting relations to parentId THEN the system SHALL ensure no comment relationships are lost
3. WHEN the migration completes THEN the system SHALL validate that all comment hierarchies are preserved
4. IF the migration fails THEN the system SHALL provide clear rollback instructions
