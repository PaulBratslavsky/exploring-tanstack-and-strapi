import type { Block } from "../components/blocks/block-renderer"

export type TLink = {
  id: number
  href: string
  label: string
  isExternal: boolean
  isButtonLink: boolean
  type: string | null
}

export type TCard = {
  id: number
  heading: string
  text: string
}

export type TImage = {
  id: number
  documentId: string
  alternativeText: string | null
  url: string
}

export type TAuthor = {
  fullName: string
  bio?: string
  image?: TImage
}

export type TLogo = {
  id: number
  label: string
  href: string
  isExternal: boolean
  image: TImage
}

export type THeader = {
  id: number
  logo: TLogo
  navItems: Array<TLink>
  cta: TLink
}

export type TGlobal = {
  documentId: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  header: THeader
}

export type TLandingPage = {
  id: number;
  documentId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  blocks: Array<Block>;
}

export type TMetaData = {
  documentId: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  publishedAt: string
}

export type TAuthUser = {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

export type TStrapiResponseSingle<T> = {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export type TStrapiResponseCollection<T> = {
  data: Array<T>
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export type TStrapiResponse<T = null> = {
  data?: T
  error?: {
    status: number
    name: string
    message: string
    details?: Record<string, Array<string>>
  }
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export type TComment = {
  id: number
  documentId: string
  content: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
  isInappropriate: boolean
  isDeleted: boolean
  contentType: 'comment' | 'content'
  contentId: string
  userId: string
  parentId?: string | null
  author?: {
    id: number
    username: string
    email: string
  }
  replies?: TComment[]
  replyCount?: number
  canEdit?: boolean
  canDelete?: boolean
}

export type TCommentCreate = {
  content: string
  contentType: 'comment' | 'content'
  contentId: string
  parentId?: string // documentId for replies
  // Legacy support
  article?: string // documentId - will be converted to contentType/contentId
  parentComment?: string // documentId - will be converted to parentId
}

export type TCommentUpdate = {
  content: string
}

export type TCommentResponse = TStrapiResponseCollection<TComment>
export type TCommentSingleResponse = TStrapiResponseSingle<TComment>
