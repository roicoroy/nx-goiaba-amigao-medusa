import { defineMiddlewares } from "@medusajs/medusa"
import { requireRole } from "../../middlewares/check-role"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/users",
      method: "POST",
      middlewares: [requireRole("admin")],
    },
  ],
})
