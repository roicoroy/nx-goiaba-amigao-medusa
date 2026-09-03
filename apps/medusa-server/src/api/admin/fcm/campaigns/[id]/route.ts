import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import FcmModuleService from "../../../../../modules/fcm/service"
import { FCM_MODULE } from "../../../../../modules/fcm"

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const fcmModuleService = req.scope.resolve(FCM_MODULE) as FcmModuleService
    const { id } = req.params

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Campaign ID is required"
      })
      return
    }

    await fcmModuleService.deleteCampaign(id)

    res.json({
      success: true,
      message: "Campaign deleted successfully"
    })
  } catch (error: any) {
    console.error("[FCM] Error in DELETE /admin/fcm/campaigns/[id]:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
      error: error?.message || String(error)
    })
  }
}

