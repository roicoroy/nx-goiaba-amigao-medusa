import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import FcmModuleService from "../../../../../modules/fcm/service"
import { FCM_MODULE } from "../../../../../modules/fcm"

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const fcmModuleService = req.scope.resolve(FCM_MODULE) as FcmModuleService
  const { id } = req.params

  try {
    await fcmModuleService.deleteFcmDeviceTokens(id)
    
    res.json({
      success: true,
      message: "Device deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete device",
      error: error.message
    })
  }
}

