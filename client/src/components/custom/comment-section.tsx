import { useQuery } from '@tanstack/react-query'
import { TComment } from '../../types'
import { CommentList } from './comment-list'
import { CommentForm } from './comment-form'
import { strapiApi } from '../../data/server-functions'
import { type CurrentUser } from '../../lib/comment-auth'

interface CommentSectionProps {
  readonly articleDocumentId: string
  readonly currentUser?: CurrentUser | null
  readonly className?: string
}

export function CommentSection({ articleDocumentId, currentUser, className = '' }: CommentSectionProps) {
  const {
    data: commentsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['comments', articleDocumentId],
    queryFn: () => strapiApi.comments.getCommentsForArticle({ data: articleDocumentId }),
    enabled: !!articleDocumentId,
  })

  // Note: Hierarchy building is now handled on the server side
  // The API returns pre-built hierarchical comment structures
  
  // Helper function to count total comments in hierarchical structure
  const countTotalComments = (comments: TComment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countTotalComments(comment.replies) : 0)
    }, 0)
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <p>Failed to load comments</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Comments are already hierarchical from the API
  const hierarchicalComments = commentsResponse?.data || []
  const totalCommentCount = countTotalComments(hierarchicalComments)

  return (
    <div className={`${className}`}>
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Comments ({totalCommentCount})
        </h3>
        
        <div className="space-y-6">
          <CommentForm 
            articleDocumentId={articleDocumentId}
            currentUser={currentUser}
          />
          
          <CommentList 
            comments={hierarchicalComments} 
            currentUser={currentUser}
            articleDocumentId={articleDocumentId}
            onReplySuccess={() => refetch()}
          />
        </div>
      </div>
    </div>
  )
}