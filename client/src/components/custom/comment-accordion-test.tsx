// This is a test component to verify the accordion works
// You can delete this file after testing

import { CommentAccordion } from './comment-accordion'
import { TComment } from '../../types'

const mockComment: TComment = {
  id: 1,
  documentId: 'test-comment',
  content: 'This is a parent comment with replies',
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
    username: 'testuser',
    email: 'test@example.com'
  },
  replies: [
    {
      id: 2,
      documentId: 'test-reply-1',
      content: 'This is the first reply',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      isInappropriate: false,
      isDeleted: false,
      contentType: 'comment',
      contentId: 'test-article',
      userId: '2',
      parentId: 'test-comment',
      author: {
        id: 2,
        username: 'replier1',
        email: 'replier1@example.com'
      }
    },
    {
      id: 3,
      documentId: 'test-reply-2',
      content: 'This is the second reply with more content to test how longer replies look in the accordion interface',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      isInappropriate: false,
      isDeleted: false,
      contentType: 'comment',
      contentId: 'test-article',
      userId: '3',
      parentId: 'test-comment',
      author: {
        id: 3,
        username: 'replier2',
        email: 'replier2@example.com'
      }
    }
  ]
}

export function CommentAccordionTest() {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-6">Comment Accordion Test</h2>
      <CommentAccordion 
        comment={mockComment}
        currentUser={{ userId: 1, username: 'testuser', email: 'test@example.com' }}
        articleDocumentId="test-article"
        depth={0}
      />
    </div>
  )
}