export default {
  async hello(ctx, next) { // called by GET /hello
    ctx.body = 'Hello World!'; // you could also send a JSON response here
  },
};