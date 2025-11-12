/**
 * comment router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/comments/custom/get-comments",
      handler: "comment.getComments",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/comments/get/hello",
      handler: "custom.hello",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
