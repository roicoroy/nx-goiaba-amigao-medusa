import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import FcmModuleService from "../../../../modules/fcm/service"
import { FCM_MODULE } from "../../../../modules/fcm"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const fcmModuleService = req.scope.resolve(FCM_MODULE) as FcmModuleService
    
    const { platform, customer_id, skip = 0, take = 50 } = req.query

    const filters: any = {}
    
    if (platform && ["ios", "android", "web"].includes(platform as string)) {
      filters.platform = platform
    }
    
    if (customer_id) {
      filters.customer_id = customer_id
    }

    const [devices, count] = await fcmModuleService.listAndCountFcmDeviceTokens(
      filters,
      {
        skip: Number(skip),
        take: Number(take),
        order: { created_at: "DESC" }
      }
    )

    res.json({
      success: true,
      data: {
        devices,
        count,
        skip: Number(skip),
        take: Number(take)
      }
    })
  } catch (error) {
    console.error("Error in GET /admin/fcm/devices:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch devices",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}

