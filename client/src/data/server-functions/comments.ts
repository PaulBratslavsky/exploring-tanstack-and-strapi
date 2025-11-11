import { createServerFn } from '@tanstack/react-start'
import type {
  TCommentCreate,
  TCommentUpdate,
  TCommentResponse,
  TCommentSingleResponse,
} from '@/types'
import { sdk } from '@/data/strapi-sdk'
import { useAppSession } from '@/lib/session'
import { getStrapiURL } from '@/lib/utils'

const comments = sdk.collection('comments')
const baseUrl = getStrapiURL()

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit,
  jwt: string,
) => {
  const url = new URL(endpoint, baseUrl)

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Get comments for a specific article
const getCommentsForArticleInternal = async (articleDocumentId: string) => {
  return comments.find({
    filters: {
      contentType: {
        $eq: 'comment',
      },
      contentId: {
        $eq: articleDocumentId,
      },
      isDeleted: {
        $eq: false,
      },
    },
    // No populate needed - hierarchy is built on server side
    // Author info is included via userId field
    sort: ['createdAt:desc'],
  }) as Promise<TCommentResponse>
}

// Create a new comment
const createCommentInternal = async (
  commentData: TCommentCreate,
  jwt: string,
) => {
  if (!commentData) {
    throw new Error('Comment data is required')
  }

  if (!commentData.content) {
    throw new Error('Comment content is required')
  }

  // Support both new and legacy formats
  const hasNewFormat = commentData.contentType && commentData.contentId
  const hasLegacyFormat = commentData.article

  if (!hasNewFormat && !hasLegacyFormat) {
    throw new Error('Article or content reference is required')
  }

  const requestData: any = {
    content: commentData.content,
  }

  // Use new format if available, otherwise convert from legacy
  if (hasNewFormat) {
    requestData.contentType = commentData.contentType
    requestData.contentId = commentData.contentId
  } else if (hasLegacyFormat) {
    requestData.article = commentData.article // Backend will convert this
  }

  // Handle parent comment reference
  if (commentData.parentId) {
    requestData.parentId = commentData.parentId
  } else if (commentData.parentComment) {
    requestData.parentComment = commentData.parentComment // Backend will convert this
  }

  return makeAuthenticatedRequest(
    '/api/comments',
    {
      method: 'POST',
      body: JSON.stringify({
        data: requestData,
      }),
    },
    jwt,
  ) as Promise<TCommentSingleResponse>
}

// Update a comment
const updateCommentInternal = async (
  commentDocumentId: string,
  commentData: TCommentUpdate,
  jwt: string,
) => {
  return makeAuthenticatedRequest(
    `/api/comments/${commentDocumentId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        data: {
          content: commentData.content,
          isEdited: true,
        },
      }),
    },
    jwt,
  ) as Promise<TCommentSingleResponse>
}

// Delete a comment (soft delete using DELETE method)
const deleteCommentInternal = async (
  commentDocumentId: string,
  jwt: string,
) => {
  return makeAuthenticatedRequest(
    `/api/comments/${commentDocumentId}`,
    {
      method: 'DELETE',
    },
    jwt,
  ) as Promise<TCommentSingleResponse>
}

// Server function to get comments for an article
export const getCommentsForArticle = createServerFn({
  method: 'GET',
})
  .validator((data: string) => data)
  .handler(async ({ data: articleDocumentId }): Promise<TCommentResponse> => {
    const response = await getCommentsForArticleInternal(articleDocumentId)
    return response
  })

// Server function to create a comment
export const createComment = createServerFn({
  method: 'POST',
})
  .validator((data: TCommentCreate) => data)
  .handler(async ({ data: commentData }): Promise<TCommentSingleResponse | { error: string }> => {
    const session = await useAppSession()

    if (!session.data.jwt || !session.data.userId) {
      return { error: 'Authentication required' }
    }

    try {
      const response = await createCommentInternal(
        commentData,
        session.data.jwt,
      )
      return response
    } catch (error) {
      console.error('Error creating comment:', error)
      return {
        error:
          error instanceof Error ? error.message : 'Failed to create comment',
      }
    }
  },
)

// Server function to update a comment
export const updateComment = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { commentDocumentId: string; commentData: TCommentUpdate }) => data,
  )
  .handler(
    async ({ data }): Promise<TCommentSingleResponse | { error: string }> => {
      const session = await useAppSession()

      if (!session.data.jwt || !session.data.userId) {
        return { error: 'Authentication required' }
      }

      try {
        const response = await updateCommentInternal(
          data.commentDocumentId,
          data.commentData,
          session.data.jwt,
        )
        return response
      } catch (error) {
        console.error('Error updating comment:', error)
        return { error: 'Failed to update comment' }
      }
    },
  )

// Server function to delete a comment
export const deleteComment = createServerFn({
  method: 'POST',
})
  .validator((commentDocumentId: string) => commentDocumentId)
  .handler(
    async ({
      data: commentDocumentId,
    }): Promise<TCommentSingleResponse | { error: string }> => {
      const session = await useAppSession()

      if (!session.data.jwt || !session.data.userId) {
        return { error: 'Authentication required' }
      }

      try {
        const response = await deleteCommentInternal(
          commentDocumentId,
          session.data.jwt,
        )
        return response
      } catch (error) {
        console.error('Error deleting comment:', error)
        return { error: 'Failed to delete comment' }
      }
    },
  )
