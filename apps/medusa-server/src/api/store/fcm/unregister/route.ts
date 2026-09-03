import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import FcmModuleService from "../../../../modules/fcm/service"
import { FCM_MODULE } from "../../../../modules/fcm"

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const fcmModuleService = req.scope.resolve(FCM_MODULE) as FcmModuleService
  
  const body = req.body as { token?: string } | undefined
  const query = req.query as { token?: string } | undefined
  const token = body?.token || query?.token

  if (!token) {
    res.status(400).json({
      message: "token is required"
    })
    return
  }

  try {
    const deleted = await fcmModuleService.deleteByToken(token as string)

    if (deleted) {
      res.json({
        success: true,
        message: "Device token unregistered successfully"
      })
    } else {
      res.status(404).json({
        message: "Device token not found"
      })
    }
  } catch (error) {
    res.status(500).json({
      message: "Failed to unregister device token",
      error: error.message
    })
  }
}

