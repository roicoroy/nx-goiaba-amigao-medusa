import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import FcmModuleService from "../../../../modules/fcm/service"
import { FCM_MODULE } from "../../../../modules/fcm"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const fcmModuleService = req.scope.resolve(FCM_MODULE) as FcmModuleService
  
  const { token, platform, app_version, device_info, customer_id } = req.body as {
    token?: string
    platform?: string
    app_version?: string
    device_info?: any
    customer_id?: string
  }

  if (!token || !platform) {
    res.status(400).json({
      message: "token and platform are required"
    })
    return
  }

  if (!["ios", "android", "web"].includes(platform)) {
    res.status(400).json({
      message: "platform must be one of: ios, android, web"
    })
    return
  }

  try {
    const deviceData = {
      token,
      platform: platform as "ios" | "android" | "web",
      app_version: app_version || null,
      device_info: device_info || null,
      customer_id: customer_id || null,
      user_id: null, // Store routes typically don't have admin users
    }

    // Strategy: Make this endpoint idempotent
    // 1. First check if token already exists - if yes, return it (or update if needed)
    // 2. If not found and customer_id provided, check by customer_id + platform
    // 3. Otherwise, try to create new (handle duplicate errors gracefully)
    
    let existingDevice = await fcmModuleService.findByToken(token)
    
    // If token already exists, update it with latest data and return
    if (existingDevice && existingDevice.id) {
      try {
        const updated = await fcmModuleService.updateFcmDeviceTokens({
          id: existingDevice.id,
          ...deviceData
        })
        res.json({
          success: true,
          device: updated
        })
        return
      } catch (updateError: any) {
        // If update fails, just return the existing device
        console.warn("Update failed, returning existing device:", updateError?.message)
        res.json({
          success: true,
          device: existingDevice
        })
        return
      }
    }
    
    // If not found by token and customer_id is provided, check by customer_id + platform
    // This handles the case where the same user/device gets a new token
    if (!existingDevice && customer_id) {
      try {
        const customerDevices = await fcmModuleService.findByCustomer(customer_id)
        // Find device with same platform for this customer
        if (Array.isArray(customerDevices) && customerDevices.length > 0) {
          existingDevice = customerDevices.find(
            (d) => d && d.platform === platform && d.customer_id === customer_id
          ) || null
        }
        if (existingDevice && existingDevice.id) {
          // Update existing device with new token
          try {
            const updated = await fcmModuleService.updateFcmDeviceTokens({
              id: existingDevice.id,
              ...deviceData
            })
            res.json({
              success: true,
              device: updated
            })
            return
          } catch (updateError: any) {
            console.warn("Update failed, returning existing device:", updateError?.message)
            res.json({
              success: true,
              device: existingDevice
            })
            return
          }
        }
      } catch (err) {
        // If findByCustomer fails, continue with creation
        console.warn("Error finding customer devices:", err)
      }
    }
    
    // Try to create new device
    // If it fails because token already exists (race condition), find and return it
    try {
      const [created] = await fcmModuleService.createFcmDeviceTokens([deviceData])
      if (created) {
        res.json({
          success: true,
          device: created
        })
        return
      }
    } catch (createError: any) {
      // If creation fails for any reason, try to find the device
      // This handles race conditions and duplicate errors gracefully
      const errorMsg = createError?.message || String(createError) || ""
      console.log("FCM Register - Creation failed, attempting to find existing device:", errorMsg)
      
      // Check if it's a duplicate error
      const isDuplicateError = errorMsg.toLowerCase().includes("already exists") || 
                               errorMsg.toLowerCase().includes("duplicate") ||
                               errorMsg.toLowerCase().includes("unique constraint") ||
                               errorMsg.toLowerCase().includes("fcm device token")
      
      if (isDuplicateError) {
        // Try multiple times to find the device (handles race conditions)
        let foundDevice = null
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            // Small delay to allow database transaction to complete
            if (attempt > 0) {
              await new Promise(resolve => setTimeout(resolve, 100 * attempt))
            }
            foundDevice = await fcmModuleService.findByToken(token)
            if (foundDevice) {
              break
            }
          } catch (findError: any) {
            console.warn(`FCM Register - Find attempt ${attempt + 1} failed:`, findError?.message)
          }
        }
        
        if (foundDevice) {
          // Device exists, return it (idempotent behavior)
          console.log("FCM Register - Found existing device after creation error, returning it")
          res.json({
            success: true,
            device: foundDevice
          })
          return
        } else {
          // If we still can't find it, try listing all devices and filtering
          try {
            const [allDevices] = await fcmModuleService.listFcmDeviceTokens({})
            if (Array.isArray(allDevices)) {
              foundDevice = allDevices.find((d: any) => d && d.token === token) || null
              if (foundDevice) {
                console.log("FCM Register - Found device via list and filter")
                res.json({
                  success: true,
                  device: foundDevice
                })
                return
              }
            }
          } catch (listError: any) {
            console.warn("FCM Register - Error listing devices:", listError?.message)
          }
        }
      }
      
      // If we couldn't find the device, check if it's a duplicate error
      // If so, we'll handle it in the outer catch block
      const createErrorMsg = createError?.message || String(createError) || ""
      const errorString = createErrorMsg.toLowerCase()
      
      // If it's clearly a duplicate error, don't throw - let outer handler deal with it
      if (
        errorString.includes("already exists") || 
        errorString.includes("duplicate") || 
        errorString.includes("unique constraint") ||
        errorString.includes("fcm device token")
      ) {
        // Re-throw but it will be caught by outer handler which will try to find device again
        throw createError
      }
      
      // For other errors, throw them
      throw createError
    }

    // Should not reach here, but just in case
    throw new Error("Failed to register device token")
  } catch (error: any) {
    // Final error handler - always try to find device if error suggests it might exist
    // Extract error message from various possible error object structures
    const finalErrorMsg = error?.message || error?.error?.message || String(error) || ""
    const errorString = finalErrorMsg.toLowerCase()
    
    // Check if this looks like a duplicate/constraint error
    const looksLikeDuplicate = (
      errorString.includes("already exists") || 
      errorString.includes("fcm device token") ||
      errorString.includes("duplicate") ||
      errorString.includes("unique constraint") ||
      errorString.includes("violates unique")
    )
    
    // Always try to find the device if it looks like a duplicate error
    // This makes the endpoint truly idempotent
    if (looksLikeDuplicate) {
      console.log("FCM Register - Duplicate error detected, finding existing device for token")
      
      // Try multiple approaches to find the device
      let foundDevice = null
      
      // Approach 1: Retry findByToken with delays
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 100 * attempt))
          }
          foundDevice = await fcmModuleService.findByToken(token)
          if (foundDevice) {
            break
          }
        } catch (findError: any) {
          console.warn(`FCM Register - Find attempt ${attempt + 1} failed:`, findError?.message)
        }
      }
      
      // Approach 2: List all and filter
      if (!foundDevice) {
        try {
          const [allDevices] = await fcmModuleService.listFcmDeviceTokens({})
          if (Array.isArray(allDevices)) {
            foundDevice = allDevices.find((d: any) => d && d.token === token) || null
          }
        } catch (listError: any) {
          console.warn("FCM Register - Error listing devices:", listError?.message)
        }
      }
      
      if (foundDevice) {
        console.log("FCM Register - Found existing device, returning success (idempotent)")
        res.json({
          success: true,
          device: foundDevice
        })
        return
      } else {
        console.warn("FCM Register - Duplicate error but device not found - this shouldn't happen")
      }
    }
    
    // If we get here, it's a real error or we couldn't find the device
    console.error("FCM Register Error:", {
      message: finalErrorMsg,
      error: String(error),
      token: token?.substring(0, 20) + "..."
    })
    res.status(500).json({
      message: "Failed to register device token",
      error: finalErrorMsg
    })
  }
}

