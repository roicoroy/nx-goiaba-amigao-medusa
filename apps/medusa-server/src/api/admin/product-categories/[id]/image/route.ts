import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, MedusaError } from "@medusajs/framework/utils"
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

/**
 * PUT /admin/product-categories/:id/image - Upload/update category image
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
    try {
        const categoryId = req.params.id

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required",
            })
        }

        // Use multer middleware to handle file upload
        await new Promise<void>((resolve, reject) => {
            upload.single("image")(req as any, res as any, (err: any) => {
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

        // Get services from container
        const fileModuleService = req.scope.resolve(Modules.FILE)
        const query = req.scope.resolve("query")
        const productModuleService = req.scope.resolve(Modules.PRODUCT)

        // Retrieve category to check if it exists and get current metadata
        const { data: categories } = await query.graph({
            entity: "product_category",
            fields: ["*", "metadata"],
            filters: {
                id: categoryId,
            },
        })

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            })
        }

        const category = categories[0]

        // Delete old image if exists
        if (category.metadata?.image_key) {
            try {
                await fileModuleService.deleteFiles(category.metadata.image_key as string)
            } catch (error) {
                // Log but don't fail if old image deletion fails
                console.error("Failed to delete old category image:", error)
            }
        }

        // Upload to Cloudinary via file service
        const fileExtension = file.mimetype.split('/')[1] || 'jpg'
        const uploadResult = (await fileModuleService.createFiles({
            filename: `categories/category_${categoryId}.${fileExtension}`,
            mimeType: file.mimetype,
            content: file.buffer,
        })) as unknown as { url: string; key: string }

        // Prepare updated metadata
        const updatedMetadata = {
            ...(category.metadata || {}),
            image_url: uploadResult.url,
            image_key: uploadResult.key,
            image_uploaded_at: new Date().toISOString(),
        }

        // Update category metadata using product module service
        await productModuleService.updateProductCategories(categoryId, {
            metadata: updatedMetadata,
        })

        return res.status(200).json({
            success: true,
            data: {
                image_url: uploadResult.url,
                category_id: categoryId,
                key: uploadResult.key,
            },
            message: "Category image uploaded successfully",
        })
    } catch (error: any) {
        console.error("Category image upload error:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload category image",
        })
    }
}

/**
 * GET /admin/product-categories/:id/image - Get category image information
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        const categoryId = req.params.id

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required",
            })
        }

        // Get query service
        const query = req.scope.resolve("query")

        // Retrieve category with metadata
        const { data: categories } = await query.graph({
            entity: "product_category",
            fields: ["*", "metadata"],
            filters: {
                id: categoryId,
            },
        })

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            })
        }

        const category = categories[0]

        if (!category.metadata?.image_url) {
            return res.status(404).json({
                success: false,
                message: "No image found for this category",
            })
        }

        return res.status(200).json({
            success: true,
            data: {
                image_url: category.metadata.image_url,
                category_id: categoryId,
                uploaded_at: category.metadata.image_uploaded_at,
            },
        })
    } catch (error: any) {
        console.error("Category image retrieval error:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve category image",
        })
    }
}

/**
 * DELETE /admin/product-categories/:id/image - Delete category image
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    try {
        const categoryId = req.params.id

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required",
            })
        }

        // Get services
        const fileModuleService = req.scope.resolve(Modules.FILE)
        const query = req.scope.resolve("query")
        const productModuleService = req.scope.resolve(Modules.PRODUCT)

        // Retrieve category
        const { data: categories } = await query.graph({
            entity: "product_category",
            fields: ["*", "metadata"],
            filters: {
                id: categoryId,
            },
        })

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            })
        }

        const category = categories[0]

        if (!category.metadata?.image_key) {
            return res.status(404).json({
                success: false,
                message: "No image found for this category",
            })
        }

        // Delete from Cloudinary
        try {
            await fileModuleService.deleteFiles(category.metadata.image_key as string)
        } catch (error) {
            console.error("Failed to delete from Cloudinary:", error)
            // Continue with metadata cleanup even if Cloudinary deletion fails
        }

        // Remove image metadata from category
        const updatedMetadata = { ...category.metadata }
        delete updatedMetadata.image_url
        delete updatedMetadata.image_key
        delete updatedMetadata.image_uploaded_at

        await productModuleService.updateProductCategories(categoryId, {
            metadata: updatedMetadata,
        })

        return res.status(200).json({
            success: true,
            data: {
                category_id: categoryId,
                message: "Category image deleted successfully",
            },
        })
    } catch (error: any) {
        console.error("Category image deletion error:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete category image",
        })
    }
}

