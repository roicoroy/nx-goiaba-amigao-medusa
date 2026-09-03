import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import multer from "multer"

// Configure multer for memory storage with 5MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith("image/")) {
            cb(null, true)
        } else {
            cb(new Error("Only image files are allowed"))
        }
    },
})

// PUT /store/customers/me/avatar - Upload avatar
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
    try {
        // Validate authentication - customer context
        const customerId = (req as any).auth_context?.actor_id

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            })
        }

        // Use multer middleware to handle file upload
        await new Promise<void>((resolve, reject) => {
            upload.single("avatar")(req as any, res as any, (err: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })

        const file = (req as any).file

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            })
        }

        // Get file service from container
        const fileModuleService = req.scope.resolve(Modules.FILE)
        const customerModuleService = req.scope.resolve(Modules.CUSTOMER)

        // Get current customer to check for existing avatar
        const customer = await customerModuleService.retrieveCustomer(customerId)

        // Delete old avatar if exists
        if (customer.metadata?.avatar_key) {
            try {
                await fileModuleService.deleteFiles(customer.metadata.avatar_key as string)
            } catch (error) {
                // Log but don't fail if old avatar deletion fails
                console.error("Failed to delete old avatar:", error)
            }
        }

        // Upload to Cloudinary via file service
        const uploadResult = (await fileModuleService.createFiles({
            filename: `avatars/customer_${customerId}.${file.mimetype.split('/')[1]}`,
            mimeType: file.mimetype,
            content: file.buffer,
        })) as unknown as { url: string; key: string }

        // Update customer metadata with avatar info
        await customerModuleService.updateCustomers(customerId, {
            metadata: {
                ...customer.metadata,
                avatar_url: uploadResult.url,
                avatar_key: uploadResult.key,
                avatar_uploaded_at: new Date().toISOString(),
            },
        })

        return res.status(200).json({
            success: true,
            data: {
                avatar_url: uploadResult.url,
                customer_id: customerId,
                key: uploadResult.key,
            },
            message: "Avatar uploaded successfully",
        })
    } catch (error: any) {
        console.error("Avatar upload error:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload avatar",
        })
    }
}

// GET /store/customers/me/avatar - Get avatar
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        // Validate authentication
        const customerId = (req as any).auth_context?.actor_id

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            })
        }

        // Get customer service
        const customerModuleService = req.scope.resolve(Modules.CUSTOMER)

        // Get customer with metadata
        const customer = await customerModuleService.retrieveCustomer(customerId)

        if (!customer.metadata?.avatar_url) {
            return res.status(404).json({
                success: false,
                message: "No avatar found",
            })
        }

        return res.status(200).json({
            success: true,
            data: {
                avatar_url: customer.metadata.avatar_url,
                customer_id: customerId,
                uploaded_at: customer.metadata.avatar_uploaded_at,
            },
        })
    } catch (error: any) {
        console.error("Avatar retrieval error:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve avatar",
        })
    }
}

// DELETE /store/customers/me/avatar - Delete avatar
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    try {
        // Validate authentication
        const customerId = (req as any).auth_context?.actor_id

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            })
        }

        // Get services
        const fileModuleService = req.scope.resolve(Modules.FILE)
        const customerModuleService = req.scope.resolve(Modules.CUSTOMER)

        // Get customer
        const customer = await customerModuleService.retrieveCustomer(customerId)

        if (!customer.metadata?.avatar_key) {
            return res.status(404).json({
                success: false,
                message: "No avatar found",
            })
        }

        // Delete from Cloudinary
        try {
            await fileModuleService.deleteFiles(customer.metadata.avatar_key as string)
        } catch (error) {
            console.error("Failed to delete from Cloudinary:", error)
            // Continue with metadata cleanup even if Cloudinary deletion fails
        }

        // Remove avatar metadata from customer
        const updatedMetadata = { ...customer.metadata }
        delete updatedMetadata.avatar_url
        delete updatedMetadata.avatar_key
        delete updatedMetadata.avatar_uploaded_at

        await customerModuleService.updateCustomers(customerId, {
            metadata: updatedMetadata,
        })

        return res.status(200).json({
            success: true,
            data: {
                customer_id: customerId,
                message: "Avatar deleted successfully",
            },
        })
    } catch (error: any) {
        console.error("Avatar deletion error:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete avatar",
        })
    }
}
