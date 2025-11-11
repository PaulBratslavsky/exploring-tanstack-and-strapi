import { useState } from 'react'
import { CommentForm } from './comment-form'
import { isAuthenticated, canReplyToComment, type CurrentUser } from '../../lib/comment-auth'

interface CommentReplyProps {
  readonly commentDocumentId: string
  readonly articleDocumentId: string
  readonly currentUser?: CurrentUser | null
  readonly depth?: number
  readonly onReplySuccess?: () => void
  readonly onReplyCancel?: () => void
  readonly showForm?: boolean
  readonly className?: string
}

export function CommentReply({
  commentDocumentId,
  articleDocumentId,
  currentUser,
  depth = 0,
  onReplySuccess,
  onReplyCancel,
  showForm = false,
  className = ""
}: CommentReplyProps) {
  const [showReplyForm, setShowReplyForm] = useState(showForm)
  
  // Maximum nesting depth to maintain readability
  const MAX_DEPTH = 5
  const isMaxDepthReached = depth >= MAX_DEPTH
  const userCanReply = canReplyToComment(currentUser, depth, MAX_DEPTH)
  const userIsAuthenticated = isAuthenticated(currentUser)

  const handleReplyClick = () => {
    if (userCanReply) {
      setShowReplyForm(true)
    }
  }

  const handleReplySuccess = () => {
    setShowReplyForm(false)
    onReplySuccess?.()
  }

  const handleReplyCancel = () => {
    setShowReplyForm(false)
    onReplyCancel?.()
  }

  return (
    <div className={className}>
      {!showReplyForm && !isMaxDepthReached && !showForm && userIsAuthenticated && (
        <button
          onClick={handleReplyClick}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!userCanReply}
          aria-label="Reply to comment"
          title={!userCanReply ? "Maximum reply depth reached" : "Reply to comment"}
        >
          Reply
        </button>
      )}
      
      {!showReplyForm && isMaxDepthReached && userIsAuthenticated && !showForm && (
        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
          Maximum reply depth reached
        </span>
      )}

      {!showReplyForm && !userIsAuthenticated && !showForm && (
        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
          Sign in to reply
        </span>
      )}

      {(showReplyForm || showForm) && (
        <CommentForm
          articleDocumentId={articleDocumentId}
          parentCommentId={commentDocumentId}
          currentUser={currentUser}
          onSuccess={handleReplySuccess}
          onCancel={handleReplyCancel}
          placeholder="Write a reply..."
          className={showForm ? "" : "bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mt-3"}
        />
      )}
    </div>
  )
}