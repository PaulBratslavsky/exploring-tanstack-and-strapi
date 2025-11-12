# Implementation Plan

- [x] 1. Create new custom endpoint for hierarchical comments

  - Create new controller method `getCommentsForContent` that accepts contentId parameter
  - Add validation for contentId parameter
  - Call `findCommentsForContent` service method with hardcoded contentType 'comment'
  - Return sanitized hierarchical comment structure
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Update custom routes file

  - Remove all moderation routes (moderate, flag, getPendingComments, getFlaggedComments)
  - Remove legacy article route (`/articles/:articleId/comments`)
  - Add new route `GET /comments/for-content/:contentId` pointing to `comment.getCommentsForContent`
  - _Requirements: 1.1, 2.1, 5.1, 5.2, 5.3, 5.4_

- [x] 3. Remove unused controller methods

  - Delete `moderate` method from controller
  - Delete `flag` method from controller
  - Delete `getPendingComments` method from controller
  - Delete `getFlaggedComments` method from controller
  - Delete `getCommentsForArticle` method from controller
  - _Requirements: 1.2, 2.5_

- [x] 4. Simplify find controller method

  - Remove conditional logic that detects contentType and contentId filters
  - Remove call to `findCommentsForContent` from find method
  - Remove legacy filter format conversion logic (article.documentId to contentId)
  - Keep isDeleted filter to exclude deleted comments
  - Use standard Strapi service find method
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Remove unused service methods

  - Delete `findCommentsForArticle` method from service
  - Delete `findCommentsForContentFlat` method from service
  - Delete `flagAsInappropriate` method from service
  - Delete `unflagComment` method from service
  - _Requirements: 1.3, 7.1, 7.2_

- [x] 6. Delete validation service file

  - Delete `server/src/api/comment/services/comment-validation.js` file
  - Verify that validation methods in main service are being used
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Update client to use new endpoint

  - Modify `getCommentsForArticleInternal` in `client/src/data/server-functions/comments.ts`
  - Replace SDK find call with direct fetch to new endpoint
  - Remove contentType, contentId, and isDeleted filters
  - Update URL to `/api/comments/for-content/${articleDocumentId}`
  - _Requirements: 6.1, 6.2, 6.6_

- [x] 8. Verify CRUD operations still work
  - Test that create comment endpoint works correctly
  - Test that update comment endpoint works correctly
  - Test that delete comment endpoint works correctly
  - Verify ownership checks are still enforced
  - Verify validation is still working
  - _Requirements: 6.3, 6.4, 6.5, 4.5, 4.6, 4.7_
