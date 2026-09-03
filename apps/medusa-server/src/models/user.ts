import { model } from "@medusajs/framework/utils"

/**
 * Extend the User model with additional fields
 * These fields are added to the database via migrations
 */
export const User = model.define("user", {
  id: model.id().primaryKey(),
  email: model.text(),
  first_name: model.text().nullable(),
  last_name: model.text().nullable(),
  avatar_url: model.text().nullable(),
  phone: model.text().nullable(),
  role: model.text().nullable(),
  metadata: model.json().nullable(),
  created_at: model.dateTime(),
  updated_at: model.dateTime(),
  deleted_at: model.dateTime().nullable(),
})

export default User
