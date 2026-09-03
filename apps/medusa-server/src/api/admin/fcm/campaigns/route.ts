import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import FcmModuleService from "../../../../modules/fcm/service"
import { FCM_MODULE } from "../../../../modules/fcm"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const fcmModuleService = req.scope.resolve(FCM_MODULE) as FcmModuleService
    
    const { skip = 0, take = 50 } = req.query

    console.log("[FCM] Fetching campaigns with params:", { skip, take })

    const [campaigns, count] = await fcmModuleService.listCampaigns(
      {},
      {
        skip: Number(skip),
        take: Number(take),
        order: { created_at: "DESC" }
      }
    )

    console.log("[FCM] Found campaigns:", count, "campaigns returned:", campaigns.length)

    res.json({
      success: true,
      data: {
        campaigns,
        count,
        skip: Number(skip),
        take: Number(take)
      }
    })
  } catch (error: any) {
    console.error("[FCM] Error in GET /admin/fcm/campaigns:", error)
    console.error("[FCM] Error details:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    })
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error?.message || String(error)
    })
  }
}

