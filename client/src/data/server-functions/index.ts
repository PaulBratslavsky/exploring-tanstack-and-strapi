import { getGlobalData } from './global'
import { getLandingPageData } from './landing-page'
import { getArticlesData, getArticlesDataBySlug } from './articles'
import {
  registerUserServerFunction,
  loginUserServerFunction,
  logoutUserServerFunction,
  getCurrentUserServerFunction
} from './auth'
import {
  getCommentsForArticle,
  createComment,
  updateComment,
  deleteComment
} from './comments'

export const strapiApi = {
  global: {
    getGlobalData,
  },
  landingPage: {
    getLandingPageData,
  },
  articles: {
    getArticlesData,
    getArticlesDataBySlug,
  },
  auth: {
    registerUserServerFunction,
    loginUserServerFunction,
    logoutUserServerFunction,
    getCurrentUserServerFunction,
  },
  comments: {
    getCommentsForArticle,
    createComment,
    updateComment,
    deleteComment,
  }
}
