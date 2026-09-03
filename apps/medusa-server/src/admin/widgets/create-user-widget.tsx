import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Button, Input, Label, Select, Text, Heading } from "@medusajs/ui"
import { useState } from "react"
import { Plus } from "@medusajs/icons"

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "warehouse-staff", label: "Warehouse Staff" },
  { value: "driver", label: "Driver" },
]

const CreateUserWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "admin",
    phone: "",
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format"
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required"
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter"
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = "Password must contain at least one number"
    }

    // First name validation
    if (!formData.first_name) {
      errors.first_name = "First name is required"
    } else if (formData.first_name.length < 2) {
      errors.first_name = "First name must be at least 2 characters"
    }

    // Last name validation
    if (!formData.last_name) {
      errors.last_name = "Last name is required"
    } else if (formData.last_name.length < 2) {
      errors.last_name = "Last name must be at least 2 characters"
    }

    // Role validation
    if (!formData.role) {
      errors.role = "Role is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setValidationErrors({ ...validationErrors, avatar: "Please select an image file" })
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors({ ...validationErrors, avatar: "Image must be less than 5MB" })
        return
      }
      
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Clear avatar error
      const { avatar, ...rest } = validationErrors
      setValidationErrors(rest)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    setSuccess(false)

    // Validate form
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Step 1: Create the user
      const response = await fetch("/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      // Handle non-JSON responses (like HTML error pages)
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Handle successful response
      if (response.ok && data.success) {
        // Step 2: Upload avatar if provided
        if (avatarFile && data.user?.id) {
          try {
            const avatarFormData = new FormData()
            avatarFormData.append("avatar", avatarFile)
            
            await fetch(`/admin/users/${data.user.id}/avatar`, {
              method: "PUT",
              credentials: "include",
              body: avatarFormData,
            })
            // Don't fail user creation if avatar upload fails
          } catch (avatarError) {
            console.error("Failed to upload avatar:", avatarError)
          }
        }
        
        setSuccess(true)
        // Reset form
        setFormData({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          role: "admin",
          phone: "",
        })
        setAvatarFile(null)
        setAvatarPreview(null)
        setValidationErrors({})
        
        // Show success message and close modal after delay
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          // Refresh the page to show new user
          window.location.reload()
        }, 1500)
      } else {
        // Handle error responses with specific messages
        if (response.status === 401) {
          setError("Unauthorized. Please log in again.")
        } else if (response.status === 403) {
          setError("You don't have permission to create users.")
        } else if (response.status === 409) {
          setError(data.message || "Email already exists")
          if (data.errors?.email) {
            setValidationErrors({ email: data.errors.email })
          }
        } else if (response.status === 400) {
          setError(data.message || "Invalid input")
          if (data.errors) {
            setValidationErrors(data.errors)
          }
        } else {
          setError(data.message || "Failed to create user")
        }
      }
    } catch (err: any) {
      console.error("Error creating user:", err)
      setError(err.message || "Failed to create user. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "admin",
      phone: "",
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setValidationErrors({})
    setError(null)
    setSuccess(false)
  }

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Button onClick={() => setIsOpen(true)} variant="primary">
            <Plus className="mr-2" />
            Add Team Member
          </Button>
        </div>
      </Container>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCancel}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex-shrink-0">
              <Heading level="h2">Add Team Member</Heading>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto flex-1">
              <div className="flex flex-col gap-4">
                {/* Avatar Upload */}
                <div>
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {/* Avatar Preview or Placeholder */}
                    <div className="flex-shrink-0">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                          <svg
                            className="h-8 w-8 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload/Remove Buttons */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="avatar-upload">
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          {avatarPreview ? "Change" : "Upload"}
                        </Button>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      {avatarPreview && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          onClick={handleRemoveAvatar}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <Text className="text-gray-500 text-xs mt-1">
                    Optional. Max 5MB. JPG, PNG, or GIF.
                  </Text>
                  {validationErrors.avatar && (
                    <Text className="text-red-600 text-sm mt-1">{validationErrors.avatar}</Text>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="mt-2"
                  />
                  {validationErrors.email && (
                    <Text className="text-red-600 text-sm mt-1">{validationErrors.email}</Text>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="mt-2"
                  />
                  <Text className="text-gray-500 text-xs mt-1">
                    Must be at least 8 characters with 1 uppercase and 1 number
                  </Text>
                  {validationErrors.password && (
                    <Text className="text-red-600 text-sm mt-1">{validationErrors.password}</Text>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <Label htmlFor="first_name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                    className="mt-2"
                  />
                  {validationErrors.first_name && (
                    <Text className="text-red-600 text-sm mt-1">{validationErrors.first_name}</Text>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                    className="mt-2"
                  />
                  {validationErrors.last_name && (
                    <Text className="text-red-600 text-sm mt-1">{validationErrors.last_name}</Text>
                  )}
                </div>

                {/* Role */}
                <div>
                  <Label htmlFor="role">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <Select.Trigger className="mt-2" id="role">
                      <Select.Value placeholder="Select a role" />
                    </Select.Trigger>
                    <Select.Content className="z-[100]" position="popper" sideOffset={5}>
                      {ROLES.map((role) => (
                        <Select.Item key={role.value} value={role.value}>
                          {role.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                  {validationErrors.role && (
                    <Text className="text-red-600 text-sm mt-1">{validationErrors.role}</Text>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                    className="mt-2"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <Text className="text-red-800 text-sm font-medium">{error}</Text>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="rounded-md bg-green-50 border border-green-200 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <Text className="text-green-800 text-sm font-medium">User created successfully!</Text>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "user.list.before",
})

export default CreateUserWidget
