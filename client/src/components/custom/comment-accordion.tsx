import { TComment } from '../../types'
import { CommentItem } from './comment-item'
import { CommentList } from './comment-list'
import { type CurrentUser } from '../../lib/comment-auth'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'

interface CommentAccordionProps {
  readonly comment: TComment
  readonly currentUser?: CurrentUser | null
  readonly articleDocumentId: string
  readonly depth?: number
  readonly onReplySuccess?: () => void
  readonly className?: string
}

// Helper functions (removed unused ones)

// Component for reply count badge
function ReplyCountBadge({ replyCount }: { readonly replyCount: number }) {
  return (
    <div className="mb-4">
      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
        {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
      </div>
    </div>
  )
}

export function CommentAccordion({
  comment,
  currentUser,
  articleDocumentId,
  depth = 0,
  onReplySuccess,
  className = '',
}: CommentAccordionProps) {
  const hasReplies = comment.replies && comment.replies.length > 0
  const replyCount = comment.replies?.length || 0

  // If no replies, render as regular comment item
  if (!hasReplies) {
    return (
      <CommentItem
        comment={comment}
        currentUser={currentUser}
        articleDocumentId={articleDocumentId}
        depth={depth}
        onReplySuccess={onReplySuccess}
        className={className}
      />
    )
  }

  return (
    <div className={className}>
      {/* Main Comment */}
      <CommentItem
        comment={comment}
        currentUser={currentUser}
        articleDocumentId={articleDocumentId}
        depth={depth}
        onReplySuccess={onReplySuccess}
      />

      {/* Replies Accordion */}
      <div className={`mt-3 ${depth === 0 ? 'ml-11' : 'ml-8'}`}>
        <Accordion
          type="single"
          collapsible
          defaultValue="replies"
          className="border-none"
        >
          <AccordionItem value="replies" className="border-none">
            <AccordionTrigger className="py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:no-underline">
              <div className="flex items-center space-x-2">
                <span>
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </span>
                {depth === 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    • Click to expand thread
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-0">
              {/* Visual thread indicator */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-blue-100 to-transparent dark:from-blue-700 dark:via-blue-800 opacity-60" />

                {/* Reply count badge for root level */}
                {depth === 0 && <ReplyCountBadge replyCount={replyCount} />}

                {/* Replies List */}
                <div
                  className={`${depth === 0 ? 'ml-6 pl-6' : 'ml-4 pl-4'} border-l-2 border-gray-100 dark:border-gray-700 relative`}
                >
                  {/* Decorative corner for root level */}
                  {depth === 0 && (
                    <div className="absolute -left-[2px] top-0 w-3 h-3 border-l-2 border-b-2 border-gray-100 dark:border-gray-700 rounded-bl-lg"></div>
                  )}

                  <CommentList
                    comments={comment.replies || []}
                    currentUser={currentUser}
                    articleDocumentId={articleDocumentId}
                    depth={depth + 1}
                    onReplySuccess={onReplySuccess}
                    className={depth === 0 ? 'space-y-4' : 'space-y-3'}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
