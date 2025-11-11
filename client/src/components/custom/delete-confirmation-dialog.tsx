import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { strapiApi } from '../../data/server-functions'

interface DeleteConfirmationDialogProps {
  readonly isOpen: boolean
  readonly commentDocumentId: string
  readonly articleDocumentId: string
  readonly onClose: () => void
  readonly onConfirm?: () => void
}

export function DeleteConfirmationDialog({
  isOpen,
  commentDocumentId,
  articleDocumentId,
  onClose,
  onConfirm
}: DeleteConfirmationDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      const result = await strapiApi.comments.deleteComment({ data: commentDocumentId })
      if ('error' in result) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', articleDocumentId] })
      setError(null)
      onConfirm?.()
      onClose()
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to delete comment')
    }
  })

  const handleConfirm = () => {
    setError(null)
    deleteCommentMutation.mutate()
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm border-0 p-0 cursor-default"
        onClick={handleCancel}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleCancel()
          }
        }}
        aria-label="Close dialog"
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Delete Comment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Are you sure you want to delete this comment? This action cannot be undone and will also delete all replies to this comment.
            </p>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={deleteCommentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}