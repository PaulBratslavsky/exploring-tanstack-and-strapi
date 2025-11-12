/**
 * comment router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::comment.comment", {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {
      middlewares: [],
    },
    create: {
      middlewares: [],
    },
    update: {
      middlewares: ["global::is-owner"],
    },
    delete: {
      middlewares: ["global::is-owner"],
    },
  },
});
