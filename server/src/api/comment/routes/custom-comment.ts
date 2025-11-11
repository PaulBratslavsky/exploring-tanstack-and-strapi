/**
 * Custom comment routes for moderation and additional functionality
 */

export default {
  routes: [
    {
      method: 'PUT',
      path: '/comments/:id/moderate',
      handler: 'comment.moderate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/comments/:id/flag',
      handler: 'comment.flag',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/comments/pending',
      handler: 'comment.getPendingComments',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/comments/flagged',
      handler: 'comment.getFlaggedComments',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/:articleId/comments',
      handler: 'comment.getCommentsForArticle',
      config: {
        policies: [],
        middlewares: ['api::comment.comment-populate'],
      },
    },
  ],
};