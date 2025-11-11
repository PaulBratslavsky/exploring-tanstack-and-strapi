import type { TComment } from '../types'

export interface CurrentUser {
  userId: number
  email?: string
  username?: string
}

/**
 * Check if the current user can edit a comment
 * Users can only edit their own comments
 */
export function canEditComment(comment: TComment, currentUser?: CurrentUser | null): boolean {
  if (!currentUser || !comment.author) return false
  return currentUser.userId === comment.author.id
}

/**
 * Check if the current user can delete a comment
 * Users can only delete their own comments
 */
export function canDeleteComment(comment: TComment, currentUser?: CurrentUser | null): boolean {
  if (!currentUser || !comment.author) return false
  return currentUser.userId === comment.author.id
}

/**
 * Check if the current user can reply to comments
 * Only authenticated users can reply, with depth limitations
 */
export function canReplyToComment(currentUser?: CurrentUser | null, depth: number = 0, maxDepth: number = 5): boolean {
  if (!currentUser) return false
  return depth < maxDepth
}

/**
 * Check if the current user is authenticated
 */
export function isAuthenticated(currentUser?: CurrentUser | null): boolean {
  return !!currentUser && !!currentUser.userId
}

/**
 * Get user permissions for a comment
 */
export function getCommentPermissions(comment: TComment, currentUser?: CurrentUser | null, depth: number = 0) {
  return {
    canEdit: canEditComment(comment, currentUser),
    canDelete: canDeleteComment(comment, currentUser),
    canReply: canReplyToComment(currentUser, depth),
    isAuthenticated: isAuthenticated(currentUser),
    isOwner: currentUser?.userId === comment.author?.id
  }
}

/**
 * Handle authentication errors gracefully
 */
export function handleAuthError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'Please sign in to perform this action'
    }
    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      return 'You do not have permission to perform this action'
    }
    return error.message
  }
  return 'An authentication error occurred'
}