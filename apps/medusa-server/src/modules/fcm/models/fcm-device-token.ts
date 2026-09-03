import { model } from "@medusajs/framework/utils"

export const FcmDeviceToken = model.define("fcm_device_token", {
  id: model.id().primaryKey(),
  token: model.text(),
  platform: model.enum(["ios", "android", "web"]),
  app_version: model.text().nullable(),
  device_info: model.json().nullable(),
  customer_id: model.text().nullable(),
  user_id: model.text().nullable(),
})
.indexes([
  {
    on: ["token"],
    unique: true
  },
  {
    on: ["customer_id"]
  },
  {
    on: ["platform"]
  }
])

