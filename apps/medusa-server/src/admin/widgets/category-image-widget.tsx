import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useState, useEffect, useRef } from "react"
import {
  DetailWidgetProps,
} from "@medusajs/framework/types"

type AdminProductCategory = {
  id: string
  name: string
  metadata?: {
    image_url?: string
    image_key?: string
    image_uploaded_at?: string
    [key: string]: any
  }
  [key: string]: any
}

const CategoryImageWidget = ({
  data: category,
}: DetailWidgetProps<AdminProductCategory>) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (category) {
      // Check if category has image in metadata
      const imageFromMetadata = category.metadata?.image_url
      if (imageFromMetadata) {
        setImageUrl(imageFromMetadata)
      }
      setLoading(false)
    } else {
      // Fetch image if category data doesn't have metadata
      fetchImage()
    }
  }, [category?.id])

  const fetchImage = async () => {
    if (!category?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/admin/product-categories/${category.id}/image`, {
        credentials: "include",
      })
      const data = await response.json()
      
      if (data.success && data.data?.image_url) {
        setImageUrl(data.data.image_url)
      }
    } catch (err) {
      console.error("Failed to load category image:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    if (!category?.id) {
      setError("Category ID is missing")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`/admin/product-categories/${category.id}/image`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.data?.image_url) {
        setImageUrl(data.data.image_url)
        // Optionally refresh the page or update category data
        // window.location.reload()
      } else {
        setError(data.message || "Failed to upload image")
      }
    } catch (err) {
      setError("Failed to upload image")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category image?")) return

    if (!category?.id) {
      setError("Category ID is missing")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const response = await fetch(`/admin/product-categories/${category.id}/image`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setImageUrl(null)
        // Optionally refresh the page
        // window.location.reload()
      } else {
        setError(data.message || "Failed to delete image")
      }
    } catch (err) {
      setError("Failed to delete image")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  if (!category) {
    return null
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text>Loading category image...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Category Image</Heading>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex flex-col items-center gap-4">
          {/* Image Display */}
          <div className="relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={category.name || "Category"}
                className="h-48 w-48 object-cover border-2 border-gray-200 rounded-lg"
              />
            ) : (
              <div className="h-48 w-48 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                <Text className="text-gray-400 text-sm">No image</Text>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full rounded-md bg-red-50 p-3">
              <Text className="text-red-800 text-sm">{error}</Text>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={handleUploadClick}
              disabled={uploading}
              variant="secondary"
            >
              {uploading ? "Uploading..." : imageUrl ? "Change Image" : "Upload Image"}
            </Button>

            {imageUrl && (
              <Button
                onClick={handleDelete}
                disabled={uploading}
                variant="danger"
              >
                Delete
              </Button>
            )}
          </div>

          <Text className="text-sm text-gray-500 text-center">
            Recommended: Square image, at least 400x400px
            <br />
            Max file size: 5MB
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.before",
})

export default CategoryImageWidget

