// Test component to verify nested accordion functionality
// You can delete this file after testing

import { CommentList } from './comment-list'
import { TComment } from '../../types'

const mockNestedComments: TComment[] = [
  {
    id: 1,
    documentId: 'root-comment-1',
    content: 'This is a root comment with nested replies',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEdited: false,
    isInappropriate: false,
    isDeleted: false,
    contentType: 'comment',
    contentId: 'test-article',
    userId: '1',
    parentId: null,
    author: {
      id: 1,
      username: 'rootuser',
      email: 'root@example.com'
    },
    replies: [
      {
        id: 2,
        documentId: 'reply-1-1',
        content: 'First level reply',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
        isInappropriate: false,
        isDeleted: false,
        contentType: 'comment',
        contentId: 'test-article',
        userId: '2',
        parentId: 'root-comment-1',
        author: {
          id: 2,
          username: 'replier1',
          email: 'replier1@example.com'
        },
        replies: [
          {
            id: 3,
            documentId: 'reply-2-1',
            content: 'Second level reply - this should also be in an accordion',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
            isInappropriate: false,
            isDeleted: false,
            contentType: 'comment',
            contentId: 'test-article',
            userId: '3',
            parentId: 'reply-1-1',
            author: {
              id: 3,
              username: 'replier2',
              email: 'replier2@example.com'
            },
            replies: [
              {
                id: 4,
                documentId: 'reply-3-1',
                content: 'Third level reply - deeply nested!',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isEdited: false,
                isInappropriate: false,
                isDeleted: false,
                contentType: 'comment',
                contentId: 'test-article',
                userId: '4',
                parentId: 'reply-2-1',
                author: {
                  id: 4,
                  username: 'replier3',
                  email: 'replier3@example.com'
                }
              }
            ]
          }
        ]
      },
      {
        id: 5,
        documentId: 'reply-1-2',
        content: 'Another first level reply without children',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
        isInappropriate: false,
        isDeleted: false,
        contentType: 'comment',
        contentId: 'test-article',
        userId: '5',
        parentId: 'root-comment-1',
        author: {
          id: 5,
          username: 'replier4',
          email: 'replier4@example.com'
        }
      }
    ]
  }
]

export function NestedCommentTest() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-6">Nested Comment Accordion Test</h2>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        This test shows:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Root comment with accordion (has replies)</li>
          <li>First level reply with accordion (has nested replies)</li>
          <li>Second level reply with accordion (has deeply nested reply)</li>
          <li>Third level reply (no children, regular comment item)</li>
          <li>Another first level reply (no children, regular comment item)</li>
        </ul>
      </div>
      <CommentList 
        comments={mockNestedComments}
        currentUser={{ userId: 1, username: 'testuser', email: 'test@example.com' }}
        articleDocumentId="test-article"
        depth={0}
      />
    </div>
  )
}