import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs/promises"
import path from "path"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

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

// Helper function to get avatar metadata file path
function getAvatarMetadataPath(userId: string): string {
  return path.join(process.cwd(), "data", "avatars", `admin_${userId}.json`)
}

// Helper function to read avatar metadata
async function readAvatarMetadata(userId: string) {
  try {
    const metadataPath = getAvatarMetadataPath(userId)
    const data = await fs.readFile(metadataPath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}

// Helper function to write avatar metadata
async function writeAvatarMetadata(userId: string, metadata: any) {
  const metadataPath = getAvatarMetadataPath(userId)
  const dir = path.dirname(metadataPath)

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true })

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
}

/**
 * GET /admin/users/:id/avatar - Get a specific user's avatar
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const userId = req.params.id

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      })
    }

    // Read avatar metadata from file system
    const metadata = await readAvatarMetadata(userId)

    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: "No avatar found",
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        avatar_url: metadata.avatar_url || null,
        user_id: userId,
        uploaded_at: metadata.uploaded_at || null,
      },
    })
  } catch (error: any) {
    console.error("Error fetching user avatar:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch avatar",
    })
  }
}

/**
 * PUT /admin/users/:id/avatar - Upload avatar for a specific user
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const userId = req.params.id

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
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

    // Delete old avatar if exists
    const existingMetadata = await readAvatarMetadata(userId)
    if (existingMetadata?.avatar_public_id) {
      try {
        await cloudinary.uploader.destroy(existingMetadata.avatar_public_id)
      } catch (error) {
        // Log but don't fail if old avatar deletion fails
        console.error("Failed to delete old avatar:", error)
      }
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: `${process.env.CLOUDINARY_ROOT_FOLDER || "medusa-store"}/avatars`,
            public_id: `admin_${userId}`,
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
          }
        )
        .end(file.buffer)
    })

    // Save metadata
    const metadata = {
      avatar_url: uploadResult.secure_url,
      avatar_public_id: uploadResult.public_id,
      user_id: userId,
      uploaded_at: new Date().toISOString(),
    }

    await writeAvatarMetadata(userId, metadata)

    return res.status(200).json({
      success: true,
      data: {
        avatar_url: metadata.avatar_url,
        user_id: metadata.user_id,
        public_id: metadata.avatar_public_id,
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
