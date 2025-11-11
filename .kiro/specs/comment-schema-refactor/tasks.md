# Implementation Plan

- [x] 1. Update comment schema and add migration utilities

  - Modify the comment schema.json to add parentId field and remove relation fields
  - Create database migration script to convert existing relations to parentId values
  - Add validation for parentId field format and constraints
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [x] 2. Implement comment service layer refactoring
- [x] 2.1 Create hierarchy building utilities

  - Write buildCommentHierarchy method to construct nested structure from flat array
  - Implement validateParentComment method to ensure parent exists and is accessible
  - Add helper methods for parent-child relationship validation
  - _Requirements: 1.4, 3.1, 3.3_

- [x] 2.2 Update comment service methods

  - Modify findCommentsForArticle to use parentId filtering instead of relations
  - Update createComment method to handle parentId assignment
  - Refactor comment validation logic for new schema structure
  - _Requirements: 1.4, 2.1, 3.1, 3.2_

- [ ]\* 2.3 Write unit tests for service layer changes

  - Create tests for buildCommentHierarchy with various nesting scenarios
  - Test parentId validation edge cases and error conditions
  - Verify comment creation and hierarchy building performance
  - _Requirements: 1.4, 3.1_

- [x] 3. Update comment controller layer
- [x] 3.1 Modify controller methods for new schema

  - Update create method to accept parentId and convert from parentComment field
  - Modify find methods to use new service layer hierarchy building
  - Ensure API response format remains compatible with frontend expectations
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [x] 3.2 Add error handling for parentId validation

  - Implement proper error responses for invalid parent references
  - Add validation for circular reference prevention
  - Handle edge cases like deleted parent comments
  - _Requirements: 3.2, 3.3_

- [ ]\* 3.3 Write integration tests for controller endpoints

  - Test comment creation with parentId through API endpoints
  - Verify nested comment retrieval returns correct hierarchy
  - Test error handling for invalid parentId scenarios
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 4. Execute schema migration and data conversion
- [x] 4.1 Run migration script on existing data

  - Execute the migration to convert existing parentComment relations to parentId values
  - Validate that all comment relationships are preserved correctly
  - Create backup of original data before migration
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.2 Verify data integrity post-migration

  - Check that all comment hierarchies are correctly maintained
  - Validate that no comments are orphaned or have invalid parentId references
  - Test comment functionality with migrated data
  - _Requirements: 4.2, 4.3_

- [ ] 5. Update frontend integration points
- [x] 5.1 Remove client-side hierarchy building logic

  - Remove buildCommentHierarchy function from comment-section.tsx
  - Update comment components to expect pre-built hierarchy from API
  - Ensure comment creation still works with new backend structure
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 5.2 Update TypeScript types and interfaces

  - Modify TComment type to include parentId field
  - Update comment-related type definitions to reflect schema changes
  - Ensure type safety across frontend comment components
  - _Requirements: 3.1, 3.2_

- [ ]\* 5.3 Write end-to-end tests for comment functionality

  - Test complete comment creation and display workflow
  - Verify nested comment replies work correctly
  - Test comment editing and deletion with new schema
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Performance optimization and cleanup
- [ ] 6.1 Optimize comment queries and hierarchy building

  - Add database indexes for parentId field for efficient querying
  - Implement caching strategy for frequently accessed comment trees
  - Optimize memory usage during hierarchy construction
  - _Requirements: 1.4, 3.4_

- [ ] 6.2 Remove deprecated relation fields and code
  - Clean up old parentComment and replies relation fields from schema
  - Remove unused relation-based code from services and controllers
  - Update documentation to reflect new parentId approach
  - _Requirements: 1.1, 1.2_
