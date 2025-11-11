import { TComment } from '../../types'
import { CommentItem } from './comment-item'
import { CommentAccordion } from './comment-accordion'
import { type CurrentUser } from '../../lib/comment-auth'

interface CommentListProps {
  readonly comments: TComment[]
  readonly currentUser?: CurrentUser | null
  readonly articleDocumentId: string
  readonly depth?: number
  readonly onReplySuccess?: () => void
  readonly className?: string
}

export function CommentList({ 
  comments, 
  currentUser, 
  articleDocumentId,
  depth = 0, 
  onReplySuccess, 
  className = '' 
}: CommentListProps) {
  // Sort comments chronologically (newest first)
  const sortedComments = [...comments].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Show empty state if no comments (only for root level)
  if (comments.length === 0 && depth === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    )
  }

  // Don't render anything if no comments at nested levels
  if (comments.length === 0) {
    return null
  }

  // Calculate spacing based on depth for better visual hierarchy
  const getSpacingClass = (depth: number) => {
    if (depth === 0) return 'space-y-6' // More space between root comments
    if (depth === 1) return 'space-y-4' // Medium space for first-level replies
    return 'space-y-3' // Tighter space for deeper nesting
  }

  return (
    <div className={`${getSpacingClass(depth)} ${className}`}>
      {sortedComments.map((comment) => (
        <div key={comment.documentId} className="relative">
          {/* Use accordion for any comment with replies */}
          {comment.replies && comment.replies.length > 0 ? (
            <CommentAccordion 
              comment={comment} 
              currentUser={currentUser}
              articleDocumentId={articleDocumentId}
              depth={depth}
              onReplySuccess={onReplySuccess}
            />
          ) : (
            <CommentItem 
              comment={comment} 
              currentUser={currentUser}
              articleDocumentId={articleDocumentId}
              depth={depth}
              onReplySuccess={onReplySuccess}
            />
          )}
        </div>
      ))}
    </div>
  )
}