import { Button } from '../ui/button'

interface CommentActionsProps {
  readonly canEdit: boolean
  readonly canDelete: boolean
  readonly canReply: boolean
  readonly onEdit?: () => void
  readonly onDelete?: () => void
  readonly onReply?: () => void
  readonly className?: string
  readonly isLoading?: boolean
}

export function CommentActions({
  canEdit,
  canDelete,
  canReply,
  onEdit,
  onDelete,
  onReply,
  className = "",
  isLoading = false
}: CommentActionsProps) {
  // Don't render anything if no actions are available
  if (!canEdit && !canDelete && !canReply) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 mt-2 ${className}`}>
      {canReply && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReply}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-auto p-1 text-xs transition-colors"
          aria-label="Reply to comment"
        >
          Reply
        </Button>
      )}
      
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-auto p-1 text-xs transition-colors"
          aria-label="Edit comment"
        >
          Edit
        </Button>
      )}
      
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isLoading}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-auto p-1 text-xs transition-colors"
          aria-label="Delete comment"
        >
          Delete
        </Button>
      )}
    </div>
  )
}