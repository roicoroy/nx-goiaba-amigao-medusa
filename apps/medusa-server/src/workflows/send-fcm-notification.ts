import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { sendFcmNotificationStep } from "./steps/send-fcm-notification"

type SendFcmNotificationWorkflowInput = {
  title: string
  body: string
  data?: Record<string, any>
  device_ids?: string[]
  send_to_all?: boolean
}

export const sendFcmNotificationWorkflow = createWorkflow(
  "send-fcm-notification",
  function (input: SendFcmNotificationWorkflowInput) {
    const result = sendFcmNotificationStep(input)
    return new WorkflowResponse(result)
  }
)

