import { createServerFn } from '@tanstack/react-start'
import type {
  TCommentCreate,
  TCommentUpdate,
  TCommentResponse,
  TCommentSingleResponse,
} from '@/types'
import { useAppSession } from '@/lib/session'
import { getStrapiURL } from '@/lib/utils'

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
    const errorData = await response.json().catch(() => ({}))
    console.error('API Error:', response.status, errorData)
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`)
  }

  return response.json()
}

// Get comments for a specific article using standard Strapi filtering
const getCommentsForArticleInternal = async (
  articleDocumentId: string,
  page: number = 1,
  pageSize: number = 10,
  searchQuery?: string
) => {
  const url = new URL('/api/comments', baseUrl)
  
  // Use Strapi's filtering to get comments for this article
  url.searchParams.append('filters[articleId][$eq]', articleDocumentId)
  
  // Add search filter if provided (search by author username or content)
  if (searchQuery && searchQuery.trim()) {
    url.searchParams.append('filters[$or][0][author][username][$containsi]', searchQuery.trim())
    url.searchParams.append('filters[$or][1][content][$containsi]', searchQuery.trim())
  }
  
  // Populate author to get username only (keep everything else private)
  url.searchParams.append('populate[author][fields][0]', 'username')
  
  // Pagination
  url.searchParams.append('pagination[page]', String(page))
  url.searchParams.append('pagination[pageSize]', String(pageSize))
  
  // Sort by most recent first
  url.searchParams.append('sort[0]', 'createdAt:desc')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json() as Promise<TCommentResponse>
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

  // Determine articleId
  let articleId = ''

  if (commentData.contentId) {
    // New format
    articleId = commentData.contentId
  } else if (commentData.article) {
    // Legacy format
    articleId = commentData.article
  } else {
    throw new Error('Article reference is required')
  }

  const requestData = {
    content: commentData.content,
    articleId,
    // author will be set by middleware from authenticated user
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
  .validator((data: { 
    articleDocumentId: string
    page?: number
    pageSize?: number
    searchQuery?: string
  }) => data)
  .handler(async ({ data }): Promise<TCommentResponse> => {
    const response = await getCommentsForArticleInternal(
      data.articleDocumentId,
      data.page,
      data.pageSize,
      data.searchQuery
    )
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
