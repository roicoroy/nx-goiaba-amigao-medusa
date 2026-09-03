import { AbstractFileProviderService } from "@medusajs/framework/utils"
import { Logger, FileTypes } from "@medusajs/framework/types"
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"

interface CloudinaryOptions {
    cloud_name: string
    api_key: string
    api_secret: string
    root_folder?: string
    use_file_name_as_path?: boolean
}

class CloudinaryFileService extends AbstractFileProviderService {
    static identifier = "cloudinary"

    protected logger_: Logger
    protected options_: CloudinaryOptions

    constructor(
        { logger }: { logger: Logger },
        options: CloudinaryOptions
    ) {
        super()

        this.logger_ = logger

        this.options_ = {
            root_folder: "medusa-store",
            use_file_name_as_path: false,
            ...options,
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: this.options_.cloud_name,
            api_key: this.options_.api_key,
            api_secret: this.options_.api_secret,
        })
    }

    private isImageFile(filename: string, mimeType?: string): boolean {
        // Check by mime type first if available
        if (mimeType) {
            return mimeType.startsWith('image/')
        }

        // Fallback to file extension
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico']
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
        return imageExtensions.includes(extension)
    }

    async upload(file: FileTypes.ProviderUploadFileDTO): Promise<FileTypes.ProviderFileResultDTO> {
        try {
            // Validate file content
            if (!file.content) {
                throw new Error("File content is empty")
            }

            // Determine resource type based on file extension or mime type
            const isImage = this.isImageFile(file.filename, file.mimeType)

            // Determine folder based on filename pattern
            // Check for avatars/, categories/, or default to products
            const isAvatar = file.filename.includes('avatars/')
            const isCategory = file.filename.includes('categories/')
            
            let folder: string
            if (isAvatar) {
                folder = `${this.options_.root_folder}/avatars`
            } else if (isCategory) {
                folder = `${this.options_.root_folder}/categories`
            } else {
                folder = `${this.options_.root_folder}/products`
            }
            
            const uploadOptions: any = {
                resource_type: isImage ? "image" : "raw",
                type: "upload", // All uploads are public
                folder: folder,
            }

            // For images, add quality optimization
            if (isImage) {
                uploadOptions.quality = "auto"
            }

            // If using filename as path, extract directory structure
            if (this.options_.use_file_name_as_path && file.filename.includes("/")) {
                const pathParts = file.filename.split("/")
                const filename = pathParts.pop()
                let nestedFolder: string
                if (isAvatar) {
                    nestedFolder = `${this.options_.root_folder}/avatars/${pathParts.join("/")}`
                } else if (isCategory) {
                    nestedFolder = `${this.options_.root_folder}/categories/${pathParts.join("/")}`
                } else {
                    nestedFolder = `${this.options_.root_folder}/products/${pathParts.join("/")}`
                }

                uploadOptions.folder = nestedFolder
                // Clean the public_id to avoid invalid characters
                uploadOptions.public_id = filename?.split(".")[0].replace(/[^a-zA-Z0-9_-]/g, '_')
            } else {
                // Clean the public_id to avoid invalid characters
                uploadOptions.public_id = file.filename.split(".")[0].replace(/[^a-zA-Z0-9_-]/g, '_')
            }

            // Log upload details for debugging
            this.logger_.info(`Cloudinary upload - filename: ${file.filename}, mimeType: ${file.mimeType}, isImage: ${isImage}, contentType: ${typeof file.content}, isBuffer: ${Buffer.isBuffer(file.content)}`)
            this.logger_.info(`Upload options: ${JSON.stringify(uploadOptions, null, 2)}`)

            let result: UploadApiResponse

            if (Buffer.isBuffer(file.content)) {
                // Upload from buffer
                result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => {
                            if (error) {
                                this.logger_.error("Cloudinary upload_stream error:", error)
                                reject(error)
                            } else {
                                resolve(result!)
                            }
                        }
                    ).end(file.content)
                })
            } else if (typeof file.content === 'string' && file.content.startsWith('data:')) {
                // Upload from data URL
                result = await cloudinary.uploader.upload(file.content, uploadOptions)
            } else if (typeof file.content === 'string') {
                // Handle string content - could be base64 or binary
                let buffer: Buffer
                try {
                    // Try to decode as base64 first
                    buffer = Buffer.from(file.content, 'base64')
                } catch {
                    // Fallback to binary
                    buffer = Buffer.from(file.content, 'binary')
                }

                result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => {
                            if (error) {
                                this.logger_.error("Cloudinary upload_stream error:", error)
                                reject(error)
                            } else {
                                resolve(result!)
                            }
                        }
                    ).end(buffer)
                })
            } else {
                throw new Error(`Unsupported file content type: ${typeof file.content}`)
            }

            return {
                url: result.secure_url,
                key: result.public_id,
            }
        } catch (error) {
            this.logger_.error("Error uploading file to Cloudinary:", error)
            // Log the full error details for debugging
            if (error && typeof error === 'object') {
                this.logger_.error(`Cloudinary error details: ${JSON.stringify(error, null, 2)}`)
            }
            throw new Error(`Failed to upload file: ${error?.message || error}`)
        }
    }

    async delete(files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[]): Promise<void> {
        try {
            const fileArray = Array.isArray(files) ? files : [files]

            const deletePromises = fileArray.map(async (file) => {
                await cloudinary.uploader.destroy(file.fileKey)
                this.logger_.info(`Successfully deleted file: ${file.fileKey}`)
            })

            await Promise.all(deletePromises)
        } catch (error) {
            this.logger_.error("Error deleting file from Cloudinary:", error)
            throw new Error(`Failed to delete file: ${error}`)
        }
    }
}

export default CloudinaryFileService
