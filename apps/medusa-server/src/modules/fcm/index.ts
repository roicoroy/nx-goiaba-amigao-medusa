import FcmModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const FCM_MODULE = "fcm"

export default Module(FCM_MODULE, {
  service: FcmModuleService,
})

