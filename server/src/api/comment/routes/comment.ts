/**
 * comment router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::comment.comment', {
  config: {
    find: {
      middlewares: ["api::comment.comment-populate"]
    },
    findOne: {
      middlewares: ["api::comment.comment-populate"]
    },
    create: {
      middlewares: ["api::comment.comment-populate"]
    },
    update: {
      middlewares: ["api::comment.comment-populate"]
    }
  }
});