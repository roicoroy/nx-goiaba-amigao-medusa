import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Badge, Button, Text, Input, Label, Select } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { Bolt, Plus, PencilSquare, Trash, XMark, CheckCircle } from "@medusajs/icons"

type WebhookSubscription = {
  id: string
  event_name: "order.created" | "product.created" | "product.updated"
  url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type WebhookResponse = {
  success: boolean
  webhooks: WebhookSubscription[]
  count: number
  message?: string
}

const EVENT_OPTIONS = [
  { value: "order.created", label: "Order Created" },
  { value: "product.created", label: "Product Created" },
  { value: "product.updated", label: "Product Updated" },
]

const EVENT_COLORS = {
  "order.created": "green",
  "product.created": "blue",
  "product.updated": "purple",
} as const

const WebhooksPage = () => {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookSubscription | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    event_name: "order.created" as WebhookSubscription["event_name"],
    url: "",
    is_active: true,
  })

  useEffect(() => {
    fetchWebhooks()
  }, [])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/admin/webhooks", {
        credentials: "include",
      })

      const data: WebhookResponse = await response.json()

      if (data.success) {
        setWebhooks(data.webhooks || [])
        if (data.message) {
          setError(data.message)
        }
      } else {
        setError(data.message || "Failed to fetch webhooks")
      }
    } catch (err) {
      console.error("Error fetching webhooks:", err)
      setError("Failed to load webhooks. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + "..."
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch("/admin/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage("Webhook created successfully!")
        setIsCreateModalOpen(false)
        setFormData({ event_name: "order.created", url: "", is_active: true })
        await fetchWebhooks()
      } else {
        setError(data.message || "Failed to create webhook")
      }
    } catch (err) {
      console.error("Error creating webhook:", err)
      setError("Failed to create webhook. Please try again.")
    }
  }

  const handleEdit = (webhook: WebhookSubscription) => {
    setEditingWebhook(webhook)
    setFormData({
      event_name: webhook.event_name,
      url: webhook.url,
      is_active: webhook.is_active,
    })
    setIsEditModalOpen(true)
    setError(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWebhook) return

    setError(null)

    try {
      const response = await fetch(`/admin/webhooks/${editingWebhook.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          url: formData.url,
          is_active: formData.is_active,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage("Webhook updated successfully!")
        setIsEditModalOpen(false)
        setEditingWebhook(null)
        setFormData({ event_name: "order.created", url: "", is_active: true })
        await fetchWebhooks()
      } else {
        setError(data.message || "Failed to update webhook")
      }
    } catch (err) {
      console.error("Error updating webhook:", err)
      setError("Failed to update webhook. Please try again.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook subscription?")) {
      return
    }

    setDeletingId(id)
    setError(null)

    try {
      const response = await fetch(`/admin/webhooks/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage("Webhook deleted successfully!")
        await fetchWebhooks()
      } else {
        setError(data.message || "Failed to delete webhook")
      }
    } catch (err) {
      console.error("Error deleting webhook:", err)
      setError("Failed to delete webhook. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setFormData({ event_name: "order.created", url: "", is_active: true })
    setError(null)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingWebhook(null)
    setFormData({ event_name: "order.created", url: "", is_active: true })
    setError(null)
  }

  if (loading) {
    return (
      <Container>
        <Text>Loading webhooks...</Text>
      </Container>
    )
  }

  return (
    <>
      <Container>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bolt className="w-6 h-6 text-blue-500" />
            <Heading level="h1">Webhooks</Heading>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <Text size="small" className="text-ui-fg-subtle">Total Webhooks</Text>
              <Text weight="plus">{webhooks.length}</Text>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
              <Plus className="mr-2" />
              Create Webhook
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <Text className="text-green-800 text-sm font-medium">{successMessage}</Text>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <XMark className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <Text className="text-red-800 text-sm font-medium">{error}</Text>
              </div>
            </div>
          </div>
        )}

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Event Name</Table.HeaderCell>
              <Table.HeaderCell>URL</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell>Updated</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {webhooks.map((webhook) => (
              <Table.Row key={webhook.id}>
                <Table.Cell>
                  <Badge
                    color={EVENT_COLORS[webhook.event_name]}
                    size="small"
                  >
                    {EVENT_OPTIONS.find((opt) => opt.value === webhook.event_name)?.label ||
                      webhook.event_name}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="max-w-md">
                    <Text size="small" className="truncate" title={webhook.url}>
                      {truncateUrl(webhook.url, 60)}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    color={webhook.is_active ? "green" : "grey"}
                    size="small"
                  >
                    {webhook.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{formatDate(webhook.created_at)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{formatDate(webhook.updated_at)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleEdit(webhook)}
                    >
                      <PencilSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(webhook.id)}
                      disabled={deletingId === webhook.id}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {webhooks.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12">
            <Bolt className="w-12 h-12 text-ui-fg-muted mb-4" />
            <Text className="text-ui-fg-subtle">No webhooks found</Text>
            <Text size="small" className="text-ui-fg-subtle mt-2">
              Create your first webhook to get started
            </Text>
          </div>
        )}
      </Container>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeCreateModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b flex-shrink-0">
              <Heading level="h2">Create Webhook</Heading>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-4 overflow-y-auto flex-1">
              <div className="flex flex-col gap-4">
                {/* Event Name */}
                <div>
                  <Label htmlFor="event_name">
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.event_name}
                    onValueChange={(value) =>
                      setFormData({ ...formData, event_name: value as WebhookSubscription["event_name"] })
                    }
                  >
                    <Select.Trigger className="mt-2" id="event_name">
                      <Select.Value placeholder="Select an event" />
                    </Select.Trigger>
                    <Select.Content className="z-[100]" position="popper" sideOffset={5}>
                      {EVENT_OPTIONS.map((event) => (
                        <Select.Item key={event.value} value={event.value}>
                          {event.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                {/* URL */}
                <div>
                  <Label htmlFor="url">
                    URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                    className="mt-2"
                    required
                  />
                  <Text className="text-gray-500 text-xs mt-1">
                    Full URL where webhook notifications will be sent
                  </Text>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_active">Active</Label>
                  <Text className="text-gray-500 text-xs">
                    Only active webhooks will receive notifications
                  </Text>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <XMark className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <Text className="text-red-800 text-sm font-medium">{error}</Text>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={closeCreateModal}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Webhook</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingWebhook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b flex-shrink-0">
              <Heading level="h2">Edit Webhook</Heading>
            </div>

            <form onSubmit={handleUpdate} className="px-6 py-4 overflow-y-auto flex-1">
              <div className="flex flex-col gap-4">
                {/* Event Name (read-only) */}
                <div>
                  <Label htmlFor="edit_event_name">Event Name</Label>
                  <Input
                    id="edit_event_name"
                    value={
                      EVENT_OPTIONS.find((opt) => opt.value === editingWebhook.event_name)
                        ?.label || editingWebhook.event_name
                    }
                    disabled
                    className="mt-2 bg-gray-100"
                  />
                  <Text className="text-gray-500 text-xs mt-1">
                    Event name cannot be changed after creation
                  </Text>
                </div>

                {/* URL */}
                <div>
                  <Label htmlFor="edit_url">
                    URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                    className="mt-2"
                    required
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit_is_active">Active</Label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <XMark className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <Text className="text-red-800 text-sm font-medium">{error}</Text>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Webhook</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export const config = defineRouteConfig({
  label: "Webhooks",
  icon: Bolt,
})

export default WebhooksPage

