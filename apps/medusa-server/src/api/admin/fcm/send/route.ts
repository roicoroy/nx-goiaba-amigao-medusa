import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendFcmNotificationWorkflow } from "../../../../workflows/send-fcm-notification"
import FcmModuleService from "../../../../modules/fcm/service"
import { FCM_MODULE } from "../../../../modules/fcm"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { title, body, data, device_ids, send_to_all } = req.body as {
    title?: string
    body?: string
    data?: Record<string, any>
    device_ids?: string[]
    send_to_all?: boolean | string
  }

  if (!title || !body) {
    res.status(400).json({
      success: false,
      message: "title and body are required"
    })
    return
  }

  if (!send_to_all && (!device_ids || device_ids.length === 0)) {
    res.status(400).json({
      success: false,
      message: "Either send_to_all or device_ids must be provided"
    })
    return
  }

  try {
    const fcmModuleService = req.scope.resolve(FCM_MODULE) as FcmModuleService
    const sendToAllBool = send_to_all === true || send_to_all === "true"
    
    // Get user ID from request (if available)
    const userId = (req as any).user?.id || null

    // Send notifications
    const { result } = await sendFcmNotificationWorkflow(req.scope).run({
      input: {
        title,
        body,
        data,
        device_ids,
        send_to_all: sendToAllBool
      }
    }) as { result: { success_count: number; failed_count: number; results: any[]; total_devices?: number } }

    // Save campaign to database
    try {
      const campaignData = {
        title,
        body,
        data: data || null,
        send_to_all: sendToAllBool,
        device_ids: sendToAllBool ? null : (device_ids || null),
        device_count: sendToAllBool ? (result.total_devices || 0) : (device_ids?.length || 0),
        success_count: result.success_count || 0,
        failed_count: result.failed_count || 0,
        results: result.results || null,
        sent_by: userId || null
      }
      
      console.log("[FCM] Saving campaign with data:", {
        ...campaignData,
        device_ids: campaignData.device_ids ? `${campaignData.device_ids.length} devices` : null,
        results: campaignData.results ? `${campaignData.results.length} results` : null
      })
      
      const campaign = await fcmModuleService.createCampaign(campaignData)
      console.log("[FCM] Campaign saved successfully:", campaign.id)
    } catch (campaignError: any) {
      // Log error but don't fail the request if campaign save fails
      console.error("[FCM] Failed to save campaign to database:", campaignError)
      console.error("[FCM] Error details:", {
        message: campaignError?.message,
        stack: campaignError?.stack,
        code: campaignError?.code,
        name: campaignError?.name
      })
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to send notifications",
      error: error?.message || String(error)
    })
  }
}

