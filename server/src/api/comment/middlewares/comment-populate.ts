/**
 * `comment-populate` middleware
 */

import type { Core } from "@strapi/strapi";

// No populate needed for the new schema since we use simple fields instead of relations
// The service layer handles building the hierarchy from parentId fields
const populate = {};

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    strapi.log.info("In comment-populate middleware (new schema - no populate needed).");
    
    // For the new schema, we don't need to populate relations since we use simple fields
    // The service layer handles building hierarchies from parentId fields
    // Remove any populate to avoid errors with non-existent relations
    delete ctx.query.populate;
    
    await next();
  };
};