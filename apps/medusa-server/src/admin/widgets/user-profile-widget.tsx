import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Input, Label, Select } from "@medusajs/ui"
import { useState, useEffect } from "react"

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "warehouse-staff", label: "Warehouse Staff" },
  { value: "driver", label: "Driver" },
]

const UserProfileWidget = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    role: "admin",
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/users/me", {
        credentials: "include",
      })
      const data = await response.json()
      
      if (data.success && data.user) {
        setUser(data.user)
        setFormData({
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || "",
          phone: data.user.phone || "",
          role: data.user.role || "admin",
        })
      }
    } catch (err) {
      setError("Failed to load profile")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/admin/users/me", {
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
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.message || "Failed to update profile")
      }
    } catch (err) {
      setError("Failed to update profile")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text>Loading profile...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">My Profile</Heading>
      </div>
      
      <form onSubmit={handleSubmit} className="px-6 py-4">
        <div className="flex flex-col gap-4">
          {/* Email (read-only) */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={user?.email || ""}
              disabled
              className="mt-2"
            />
          </div>

          {/* First Name */}
          <div>
            <Label>First Name</Label>
            <Input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="John"
              className="mt-2"
            />
          </div>

          {/* Last Name */}
          <div>
            <Label>Last Name</Label>
            <Input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Doe"
              className="mt-2"
            />
          </div>

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
              <Text className="text-green-800 text-sm">Profile updated successfully!</Text>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "profile.details.after",
})

export default UserProfileWidget
