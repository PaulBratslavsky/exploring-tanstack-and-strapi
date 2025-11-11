import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { TComment } from '../../types'
import { CommentActions } from './comment-actions'
import { CommentEditForm } from './comment-edit-form'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { CommentReply } from './comment-reply'
import { getCommentPermissions, handleAuthError, type CurrentUser } from '../../lib/comment-auth'

interface CommentItemProps {
  readonly comment: TComment
  readonly currentUser?: CurrentUser | null
  readonly articleDocumentId: string
  readonly depth?: number
  readonly onReplySuccess?: () => void
  readonly className?: string
}

export function CommentItem({ 
  comment, 
  currentUser, 
  articleDocumentId,
  depth = 0, 
  onReplySuccess, 
  className = '' 
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Calculate indentation with visual hierarchy
  // Use padding-left instead of margin-left for better visual hierarchy
  const getIndentationStyle = (depth: number) => {
    if (depth === 0) return {}
    
    // Progressive indentation: 16px for first level, then 12px for subsequent levels
    const baseIndent = 16
    const additionalIndent = Math.max(0, depth - 1) * 12
    const maxIndent = 64 // Maximum indentation to prevent excessive nesting
    
    return {
      paddingLeft: `${Math.min(baseIndent + additionalIndent, maxIndent)}px`
    }
  }

  // Get background class for nested comments
  const getBackgroundClass = (depth: number) => {
    if (depth === 0) return ''
    if (depth === 1) return 'bg-gray-50/50 dark:bg-gray-800/30'
    if (depth === 2) return 'bg-gray-50/70 dark:bg-gray-800/50'
    return 'bg-gray-50/90 dark:bg-gray-800/70'
  }
  
  // Get user permissions for this comment
  const permissions = getCommentPermissions(comment, currentUser, depth)

  const handleEdit = () => {
    try {
      if (!permissions.canEdit) {
        setAuthError(permissions.isAuthenticated ? 'You can only edit your own comments' : 'Please sign in to edit comments')
        return
      }
      setAuthError(null)
      setIsEditing(true)
    } catch (error) {
      setAuthError(handleAuthError(error))
    }
  }

  const handleEditSave = () => {
    setIsEditing(false)
    setIsLoading(false)
    setAuthError(null)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setIsLoading(false)
    setAuthError(null)
  }

  const handleReply = () => {
    try {
      if (!permissions.canReply) {
        setAuthError(permissions.isAuthenticated ? 'Maximum reply depth reached' : 'Please sign in to reply to comments')
        return
      }
      setAuthError(null)
      setShowReplyForm(true)
    } catch (error) {
      setAuthError(handleAuthError(error))
    }
  }

  const handleReplySuccess = () => {
    setShowReplyForm(false)
    setAuthError(null)
    onReplySuccess?.()
  }

  const handleReplyCancel = () => {
    setShowReplyForm(false)
    setAuthError(null)
  }

  const handleDelete = () => {
    try {
      if (!permissions.canDelete) {
        setAuthError(permissions.isAuthenticated ? 'You can only delete your own comments' : 'Please sign in to delete comments')
        return
      }
      setAuthError(null)
      setShowDeleteDialog(true)
    } catch (error) {
      setAuthError(handleAuthError(error))
    }
  }

  const handleDeleteConfirm = () => {
    // The delete confirmation dialog handles the actual deletion
    // This callback is just for any additional cleanup if needed
    setIsLoading(false)
    setAuthError(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setIsLoading(false)
    setAuthError(null)
  }
  
  return (
    <div 
      className={`py-3 relative rounded-lg ${getBackgroundClass(depth)} ${className}`}
      style={getIndentationStyle(depth)}
    >
      {/* Thread connection line for nested comments */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-600" />
      )}
      
      <div className="flex items-start space-x-3 relative">
        {/* Author Avatar Placeholder */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {(comment.author?.username || 
                (currentUser && currentUser.userId === comment.author?.id ? currentUser.username : '?'))
                ?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(() => {
                console.log('Debug comment author:', {
                  authorId: comment.author?.id,
                  authorUsername: comment.author?.username,
                  currentUserId: currentUser?.userId,
                  currentUsername: currentUser?.username,
                  match: currentUser?.userId === comment.author?.id
                });
                
                // If we have author username, use it
                if (comment.author?.username) {
                  return comment.author.username;
                }
                
                // If no author username but we have current user and IDs match, use current user
                if (currentUser && comment.author?.id && currentUser.userId === comment.author.id) {
                  return currentUser.username;
                }
                
                // If we have current user but no author data at all, and this might be a new comment
                if (currentUser && !comment.author) {
                  return currentUser.username;
                }
                
                return 'Unknown User';
              })()}
            </span>
            <span>•</span>
            <time dateTime={comment.createdAt}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
            {comment.isEdited && (
              <>
                <span>•</span>
                <span className="text-gray-400 dark:text-gray-500 italic">edited</span>
              </>
            )}
          </div>
          
          {/* Comment Text or Edit Form */}
          {isEditing ? (
            <div className="mt-2">
              <CommentEditForm
                commentDocumentId={comment.documentId}
                articleDocumentId={articleDocumentId}
                initialContent={comment.content}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
              />
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          )}

          {/* Authentication Error Display */}
          {authError && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {authError}
            </div>
          )}

          {/* Comment Actions */}
          {!isEditing && (
            <CommentActions
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
              canReply={permissions.canReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={handleReply}
              isLoading={isLoading}
            />
          )}

          {/* Reply Form */}
          {!isEditing && showReplyForm && permissions.canReply && (
            <div className="mt-3 relative">
              {/* Visual connection to parent comment */}
              <div className="absolute left-0 top-0 w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="pl-4">
                <CommentReply
                  commentDocumentId={comment.documentId}
                  articleDocumentId={articleDocumentId}
                  currentUser={currentUser}
                  depth={depth}
                  onReplySuccess={handleReplySuccess}
                  onReplyCancel={handleReplyCancel}
                  showForm={true}
                  className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        commentDocumentId={comment.documentId}
        articleDocumentId={articleDocumentId}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}