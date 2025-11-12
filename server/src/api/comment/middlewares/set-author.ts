/**
 * Middleware to automatically set author from authenticated user
 */

export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Get the authenticated user from the request context
    const user = ctx.state.user;

    // Only apply this logic for create actions
    if (ctx.request.method === "POST" && user) {
      // Set the author relation using the set syntax
      console.log(ctx.request.body.data);
      if (ctx.request.body.data) {
        ctx.request.body.data.author = {
          set: [user.documentId],
        };
      }
    }

    await next();
  };
};
