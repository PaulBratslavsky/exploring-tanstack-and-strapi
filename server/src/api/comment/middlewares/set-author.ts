/**
 * Middleware to automatically set author from authenticated user
 * Ensures user is authenticated and sets the author relation
 */

import type { Core } from "@strapi/strapi";

export default (_config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: any) => {
    // Get the authenticated user from the request context
    const user = ctx.state.user;

    // Only apply this logic for create actions
    if (ctx.request.method === "POST") {
      // Check if user is authenticated
      if (!user) {
        return ctx.unauthorized("You must be logged in to create a comment");
      }

      // Set the author relation using the set syntax
      console.log("=== Setting author for comment creation ===");
      console.log("ctx.body:", ctx.body);
      console.log("ctx.request.body:", ctx.request.body);
      console.log("ctx.body type:", typeof ctx.body);
      console.log("ctx.request.body type:", typeof ctx.request.body);
      
      // Try both ctx.body and ctx.request.body
      const body = ctx.request.body || ctx.body;
      
      if (!body) {
        console.error("No request body found!");
        return ctx.badRequest("Request body is required");
      }

      console.log("Body keys:", Object.keys(body));
      console.log("Body:", JSON.stringify(body, null, 2));

      if (!body.data) {
        console.error("No data property in request body!");
        return ctx.badRequest("Request body must contain a data property");
      }

      // Set the author relation - use connect for oneToOne relations
      body.data.author = {
        connect: [{ documentId: user.documentId }],
      };

      console.log("Author set successfully:", body.data.author);
      console.log("=== End middleware ===");
    }

    await next();
  };
};
