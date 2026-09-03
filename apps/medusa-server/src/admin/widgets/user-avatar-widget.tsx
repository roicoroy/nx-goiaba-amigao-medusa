import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useState, useEffect, useRef } from "react"
import { User } from "@medusajs/icons"

const UserAvatarWidget = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAvatar()
  }, [])

  const fetchAvatar = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/users/me/avatar", {
        credentials: "include",
      })
      const data = await response.json()
      
      if (data.success && data.data?.avatar_url) {
        setAvatarUrl(data.data.avatar_url)
      }
    } catch (err) {
      console.error("Failed to load avatar:", err)
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

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/admin/users/me/avatar", {
        method: "PUT",
        credentials: "include",
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.data?.avatar_url) {
        setAvatarUrl(data.data.avatar_url)
      } else {
        setError(data.message || "Failed to upload avatar")
      }
    } catch (err) {
      setError("Failed to upload avatar")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your avatar?")) return

    setUploading(true)
    setError(null)

    try {
      const response = await fetch("/admin/users/me/avatar", {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setAvatarUrl(null)
      } else {
        setError(data.message || "Failed to delete avatar")
      }
    } catch (err) {
      setError("Failed to delete avatar")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text>Loading avatar...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Profile Picture</Heading>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex flex-col items-center gap-4">
          {/* Avatar Display */}
          <div className="relative">
            <img
              src={avatarUrl || "/assets/shapes.svg"}
              alt="Profile"
              className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
            />
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
              {uploading ? "Uploading..." : avatarUrl ? "Change Picture" : "Upload Picture"}
            </Button>

            {avatarUrl && (
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
            Recommended: Square image, at least 200x200px
            <br />
            Max file size: 5MB
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "profile.details.before",
})

export default UserAvatarWidget
