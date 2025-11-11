import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { strapiApi } from '../../data/server-functions'
import type { TCommentUpdate } from '../../types'

interface CommentEditFormProps {
  readonly commentDocumentId: string
  readonly articleDocumentId: string
  readonly initialContent: string
  readonly onSave?: () => void
  readonly onCancel?: () => void
  readonly className?: string
}

export function CommentEditForm({
  commentDocumentId,
  articleDocumentId,
  initialContent,
  onSave,
  onCancel,
  className = ""
}: CommentEditFormProps) {
  const [content, setContent] = useState(initialContent)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const updateCommentMutation = useMutation({
    mutationFn: async (commentData: TCommentUpdate) => {
      const result = await strapiApi.comments.updateComment({
        data: {
          commentDocumentId,
          commentData
        }
      })
      if ('error' in result) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', articleDocumentId] })
      setError(null)
      onSave?.()
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to update comment')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    if (content.length > 1000) {
      setError('Comment must be 1000 characters or less')
      return
    }

    if (content.trim() === initialContent.trim()) {
      // No changes made, just cancel
      onCancel?.()
      return
    }

    setError(null)

    const commentData: TCommentUpdate = {
      content: content.trim()
    }

    updateCommentMutation.mutate(commentData)
  }

  const handleCancel = () => {
    setContent(initialContent)
    setError(null)
    onCancel?.()
  }

  const characterCount = content.length
  const isOverLimit = characterCount > 1000
  const isNearLimit = characterCount > 900

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md resize-none transition-colors text-sm
            ${isOverLimit 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
            }
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2
          `}
          disabled={updateCommentMutation.isPending}
          autoFocus
        />
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-red-600 dark:text-red-400">
                {error}
              </span>
            )}
          </div>
          
          <span className={`
            ${isOverLimit 
              ? 'text-red-600 dark:text-red-400 font-medium' 
              : isNearLimit 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            {characterCount}/1000
          </span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={updateCommentMutation.isPending}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          size="sm"
          disabled={updateCommentMutation.isPending || !content.trim() || isOverLimit}
        >
          {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}