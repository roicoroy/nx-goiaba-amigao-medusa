import { defineMiddlewares, authenticate } from "@medusajs/framework/http";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/webhooks*",
      middlewares: [authenticate("admin", ["session", "bearer"])],
    },
  ],
});

