import { model } from "@medusajs/framework/utils"

export const FcmCampaign = model.define("fcm_campaign", {
  id: model.id().primaryKey(),
  title: model.text(),
  body: model.text(),
  data: model.json().nullable(),
  send_to_all: model.boolean(),
  device_ids: model.json().nullable(), // Array of device IDs
  device_count: model.number(),
  success_count: model.number(),
  failed_count: model.number(),
  results: model.json().nullable(), // Array of send results
  sent_by: model.text().nullable(), // User ID who sent it
})
.indexes([
  {
    on: ["created_at"]
  },
  {
    on: ["sent_by"]
  }
])

