/**
 * comment router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::comment.comment", {
  config: {
    create: {
      middlewares: ["api::comment.set-author"],
    },
    update: {
      middlewares: ["global::is-owner"],
    },
    delete: {
      middlewares: ["global::is-owner"],
    },
  },
});
