import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Text } from "@medusajs/ui"
import { DetailWidgetProps } from "@medusajs/framework/types"
import { useState, useEffect } from "react"

type UserData = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
  phone?: string
  avatar_url?: string
}

const getRoleBadgeColor = (role?: string) => {
  switch (role) {
    case "admin":
      return "purple"
    case "manager":
      return "blue"
    case "warehouse-staff":
      return "green"
    case "driver":
      return "orange"
    default:
      return "grey"
  }
}

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "admin":
      return "Administrator"
    case "manager":
      return "Manager"
    case "warehouse-staff":
      return "Warehouse Staff"
    case "driver":
      return "Driver"
    default:
      return "User"
  }
}

const TeamMemberRoleBadge = ({ data }: DetailWidgetProps<UserData>) => {
  const { id } = data
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loadingAvatar, setLoadingAvatar] = useState(true)
  const [userData, setUserData] = useState<UserData>(data)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch complete user data including extended fields
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // Fetch user data from Medusa
        const userResponse = await fetch(`/admin/users/${id}`, {
          credentials: "include",
        })
        
        if (userResponse.ok) {
          const userResult = await userResponse.json()
          if (userResult.user) {
            setUserData(userResult.user)
          }
        }
      } catch (err) {
        console.error("Failed to load user data:", err)
      } finally {
        setLoading(false)
      }
    }

    // Fetch avatar for this specific user
    const fetchAvatar = async () => {
      try {
        setLoadingAvatar(true)
        const response = await fetch(`/admin/users/${id}/avatar`, {
          credentials: "include",
        })
        
        // Handle 404 gracefully (no avatar uploaded yet)
        if (response.status === 404) {
          console.log(`No avatar found for user ${id}, showing placeholder`)
          setAvatarUrl(null)
          return
        }
        
        const result = await response.json()
        
        if (result.success && result.data?.avatar_url) {
          console.log(`Avatar loaded for user ${id}:`, result.data.avatar_url)
          setAvatarUrl(result.data.avatar_url)
        } else {
          console.log(`No avatar URL in response for user ${id}`)
          setAvatarUrl(null)
        }
      } catch (err) {
        console.error("Failed to load avatar:", err)
        setAvatarUrl(null)
      } finally {
        setLoadingAvatar(false)
      }
    }

    if (id) {
      fetchUserData()
      fetchAvatar()
    }
  }, [id])

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-sm text-gray-500">Loading...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <div className="flex flex-col gap-3">
          {/* Role Badge */}
          <div className="flex items-center gap-2">
            <Text className="text-sm font-medium text-gray-700">Role:</Text>
            <Badge color={getRoleBadgeColor(userData.role)}>
              {getRoleLabel(userData.role)}
            </Badge>
          </div>

          {/* Phone */}
          {userData.phone && (
            <div className="flex items-center gap-2">
              <Text className="text-sm font-medium text-gray-700">Phone:</Text>
              <Text className="text-sm">{userData.phone}</Text>
            </div>
          )}

          {/* Avatar */}
          {!loadingAvatar && (
            <div className="flex items-center gap-2">
              <Text className="text-sm font-medium text-gray-700">Avatar:</Text>
              <img
                src={avatarUrl || "/assets/shapes.svg"}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "user.details.after",
})

export default TeamMemberRoleBadge
