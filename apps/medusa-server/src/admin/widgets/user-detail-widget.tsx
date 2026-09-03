import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge, Button, Input, Label, Select } from "@medusajs/ui"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"

const ROLE_COLORS = {
  admin: "purple",
  manager: "blue",
  "warehouse-staff": "orange",
  driver: "green",
} as const

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "warehouse-staff", label: "Warehouse Staff" },
  { value: "driver", label: "Driver" },
]

const UserDetailWidget = () => {
  const { id } = useParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    phone: "",
    role: "admin",
  })

  useEffect(() => {
    if (id) {
      fetchUser()
    }
  }, [id])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/admin/users/${id}`, {
        credentials: "include",
      })
      const data = await response.json()
      
      if (data.success && data.user) {
        setUser(data.user)
        setFormData({
          phone: data.user.phone || "",
          role: data.user.role || "admin",
        })
      } else {
        setError(data.message || "Failed to load user")
      }
    } catch (err) {
      setError("Failed to load user details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setSuccess(true)
        setIsEditing(false)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.message || "Failed to update user")
      }
    } catch (err) {
      setError("Failed to update user")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text>Loading user details...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-red-600">{error}</Text>
        </div>
      </Container>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Extended User Details</Heading>
        {!isEditing && (
          <Button variant="secondary" size="small" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      
      <div className="px-6 py-4">
        {isEditing ? (
          <div className="flex flex-col gap-4">
            {/* Phone */}
            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                className="mt-2"
              />
            </div>

            {/* Role */}
            <div>
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <Select.Trigger className="mt-2">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {ROLES.map((role) => (
                    <Select.Item key={role.value} value={role.value}>
                      {role.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <Text className="text-red-800 text-sm">{error}</Text>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-md bg-green-50 p-3">
                <Text className="text-green-800 text-sm">User updated successfully!</Text>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    phone: user.phone || "",
                    role: user.role || "admin",
                  })
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <Text className="text-sm text-gray-500 mb-1">Email</Text>
              <Text className="font-medium">{user.email}</Text>
            </div>

            {/* Role */}
            <div>
              <Text className="text-sm text-gray-500 mb-1">Role</Text>
              <Badge color={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || "grey"}>
                {user.role || "No role"}
              </Badge>
            </div>

            {/* First Name */}
            {user.first_name && (
              <div>
                <Text className="text-sm text-gray-500 mb-1">First Name</Text>
                <Text className="font-medium">{user.first_name}</Text>
              </div>
            )}

            {/* Last Name */}
            {user.last_name && (
              <div>
                <Text className="text-sm text-gray-500 mb-1">Last Name</Text>
                <Text className="font-medium">{user.last_name}</Text>
              </div>
            )}

            {/* Phone */}
            <div>
              <Text className="text-sm text-gray-500 mb-1">Phone</Text>
              <Text className="font-medium">{user.phone || "Not set"}</Text>
            </div>

            {/* Created At */}
            <div>
              <Text className="text-sm text-gray-500 mb-1">Created</Text>
              <Text className="font-medium">
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </div>

            {/* Updated At */}
            <div>
              <Text className="text-sm text-gray-500 mb-1">Last Updated</Text>
              <Text className="font-medium">
                {new Date(user.updated_at).toLocaleDateString()}
              </Text>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "user.details.after",
})

export default UserDetailWidget
