import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { FCM_MODULE } from "../../modules/fcm"
import FcmModuleService from "../../modules/fcm/service"

type ModuleOptions = {
  firebaseServiceAccount?: string | object
  firebaseProjectId?: string
}

import * as admin from "firebase-admin"

type SendFcmNotificationStepInput = {
  title: string
  body: string
  data?: Record<string, any>
  device_ids?: string[]
  send_to_all?: boolean
}

type SendResult = {
  device_id: string
  token: string
  success: boolean
  error?: string
}

type SendFcmNotificationStepOutput = {
  results: SendResult[]
  success_count: number
  failed_count: number
  total_devices: number
}

export const sendFcmNotificationStep = createStep(
  "send-fcm-notification",
  async (input: SendFcmNotificationStepInput, { container }): Promise<StepResponse<SendFcmNotificationStepOutput>> => {
    const fcmModuleService: FcmModuleService = container.resolve(FCM_MODULE)
    
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      // Get module options from container or environment variables
      // Module options are passed via medusa-config.ts and can be accessed through the module
      // For now, we'll use environment variables as the primary source, with container resolution as fallback
      let moduleOptions: ModuleOptions = {}
      
      // Try environment variables first (most reliable)
      const envServiceAccount = process.env.FCM_SERVICE_ACCOUNT
      const envProjectId = process.env.FCM_PROJECT_ID
      
      if (envServiceAccount) {
        moduleOptions = { firebaseServiceAccount: envServiceAccount }
      } else if (envProjectId) {
        moduleOptions = { firebaseProjectId: envProjectId }
      } else {
        // Try to resolve from container (module options might be registered)
        try {
          // Try different possible keys for module options
          moduleOptions = (container.resolve("fcmOptions") || 
                          container.resolve("fcm_module_options") || 
                          {}) as ModuleOptions
        } catch (e) {
          // Container resolution failed, options will be empty
        }
      }
      
      if (moduleOptions.firebaseServiceAccount) {
        // If service account is provided as JSON string, parse it
        const serviceAccount = typeof moduleOptions.firebaseServiceAccount === 'string'
          ? JSON.parse(moduleOptions.firebaseServiceAccount)
          : moduleOptions.firebaseServiceAccount
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        })
      } else if (moduleOptions.firebaseProjectId) {
        // Use default credentials (for Google Cloud environments)
        // Only works in GCP environments with default credentials
        try {
          admin.initializeApp({
            projectId: moduleOptions.firebaseProjectId
          })
        } catch (error: any) {
          throw new Error(`Failed to initialize Firebase with project ID ${moduleOptions.firebaseProjectId}. Error: ${error?.message || String(error)}. Please provide firebaseServiceAccount instead.`)
        }
      } else {
        // Don't try to use default credentials - they won't work outside GCP
        throw new Error("Firebase configuration not found. Please provide firebaseServiceAccount or firebaseProjectId in module options (medusa-config.ts) or environment variables (FCM_SERVICE_ACCOUNT or FCM_PROJECT_ID). For local development, you must provide firebaseServiceAccount as a JSON string or object.")
      }
    }

    // Get devices to send to
    let devices
    if (input.send_to_all) {
      const [allDevices] = await fcmModuleService.listAndCountFcmDeviceTokens({})
      devices = allDevices
    } else if (input.device_ids && input.device_ids.length > 0) {
      const [selectedDevices] = await fcmModuleService.listAndCountFcmDeviceTokens({
        id: input.device_ids
      })
      devices = selectedDevices
    } else {
      throw new Error("Either send_to_all or device_ids must be provided")
    }

    if (!devices || devices.length === 0) {
      return new StepResponse<SendFcmNotificationStepOutput>({
        results: [],
        success_count: 0,
        failed_count: 0,
        total_devices: 0
      })
    }

    // Send notifications to all devices
    const results: SendResult[] = []
    let successCount = 0
    let failedCount = 0

    // Build data payload if provided
    const dataPayload = input.data ? Object.entries(input.data).reduce((acc, [key, value]) => {
      acc[key] = String(value)
      return acc
    }, {} as Record<string, string>) : undefined

    // Build base message structure
    // For Android, we need to ensure the notification is properly configured
    const baseMessage: any = {
      notification: {
        title: input.title,
        body: input.body,
      },
      android: {
        priority: "high" as const,
        // Android notification configuration
        notification: {
          sound: "default",
          channelId: "default", // This should match a channel created in your Android app
          clickAction: "FLUTTER_NOTIFICATION_CLICK", // Adjust based on your app
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            alert: {
              title: input.title,
              body: input.body,
            },
            badge: 1,
          },
        },
      },
      // Web push configuration
      webpush: {
        notification: {
          title: input.title,
          body: input.body,
          icon: "/icon.png", // Adjust based on your app
        },
      },
    }

    // Only include data if it's provided (don't include undefined)
    if (dataPayload && Object.keys(dataPayload).length > 0) {
      baseMessage.data = dataPayload
    }

    for (const device of devices) {
      try {
        // Build the complete message for this device
        const message = {
          ...baseMessage,
          token: device.token,
        }

        console.log(`[FCM] Sending notification to device ${device.id}:`, {
          platform: device.platform,
          tokenPrefix: device.token.substring(0, 30) + '...',
          title: input.title,
          body: input.body,
          hasData: !!dataPayload,
        })
        
        const messageId = await admin.messaging().send(message)
        
        console.log(`[FCM] Successfully sent notification to device ${device.id}, messageId: ${messageId}`)
        
        results.push({
          device_id: device.id,
          token: device.token,
          success: true,
        })
        successCount++
      } catch (error: any) {
        const errorCode = error.code || 'unknown'
        const errorMessage = error.message || "Unknown error"
        
        console.error(`[FCM] Send failed for device ${device.id}:`, {
          errorCode,
          errorMessage,
          platform: device.platform,
          tokenPrefix: device.token.substring(0, 30) + '...',
        })
        
        // Handle invalid token errors - remove device if token is invalid
        if (error.code === "messaging/invalid-registration-token" || 
            error.code === "messaging/registration-token-not-registered") {
          // Token is invalid, delete it
          try {
            await fcmModuleService.deleteFcmDeviceTokens(device.id)
            console.log(`[FCM] Deleted invalid token: ${device.id}`)
          } catch (deleteError) {
            console.error(`Failed to delete invalid token ${device.id}:`, deleteError)
          }
        }
        
        results.push({
          device_id: device.id,
          token: device.token,
          success: false,
          error: errorMessage,
        })
        failedCount++
      }
    }

    return new StepResponse<SendFcmNotificationStepOutput>({
      results,
      success_count: successCount,
      failed_count: failedCount,
      total_devices: devices.length,
    })
  }
)

