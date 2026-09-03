import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Table, 
  Badge, 
  Button, 
  Text, 
  Input,
  Select,
  Checkbox,
  Textarea,
  Drawer,
  Code
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import { BellAlert, Trash, ArrowRight, CheckCircle, XCircle, Clock } from "@medusajs/icons"

type Device = {
  id: string
  token: string
  platform: "ios" | "android" | "web"
  app_version?: string
  device_info?: any
  customer_id?: string
  created_at: string
  updated_at: string
}

type MessageHistory = {
  id: string
  title: string
  body: string
  data?: any
  sentAt: Date
  sendToAll: boolean
  deviceCount: number
  success_count: number
  failed_count: number
  results?: any[]
}

const FCMPage = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [showSendDrawer, setShowSendDrawer] = useState(false)
  const [showDeviceDetails, setShowDeviceDetails] = useState<Device | null>(null)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Notification form state
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")
  const [notificationData, setNotificationData] = useState("")
  const [sendToAll, setSendToAll] = useState(false)

    // Load devices when platform filter changes
  useEffect(() => {
    fetchDevices()
  }, [platformFilter])

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoadingHistory(true)
      
      const url = "/admin/fcm/campaigns?take=100"
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && data.data?.campaigns) {
        const campaigns = data.data.campaigns.map((campaign: any) => ({
          id: campaign.id,
          title: campaign.title,
          body: campaign.body,
          data: campaign.data,
          sentAt: new Date(campaign.created_at),
          sendToAll: campaign.send_to_all,
          deviceCount: campaign.device_count,
          success_count: campaign.success_count,
          failed_count: campaign.failed_count,
          results: campaign.results || []
        }))
        setMessageHistory(campaigns)
      } else {
        setMessageHistory([])
      }
    } catch (error: any) {
      console.error("[FCM UI] Error fetching campaigns:", error)
      alert(`Error fetching campaigns: ${error.message}`)
      setMessageHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (showHistory) {
      fetchCampaigns()
    }
  }, [showHistory])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const url = platformFilter === "all" 
        ? "/admin/fcm/devices?take=100"
        : `/admin/fcm/devices?platform=${platformFilter}&take=100`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setDevices(data.data.devices || [])
      }
    } catch (error) {
      console.error("Error fetching devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to delete this device?")) {
      return
    }

    try {
      const response = await fetch(`/admin/fcm/devices/${deviceId}`, {
        method: "DELETE"
      })
      const data = await response.json()
      
      if (data.success) {
        setDevices(devices.filter(d => d.id !== deviceId))
        setSelectedDevices(prev => {
          const next = new Set(prev)
          next.delete(deviceId)
          return next
        })
      }
    } catch (error) {
      console.error("Error deleting device:", error)
      alert("Failed to delete device")
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return
    }

    try {
      const response = await fetch(`/admin/fcm/campaigns/${campaignId}`, {
        method: "DELETE"
      })
      const data = await response.json()
      
      if (data.success) {
        // Remove from local state
        setMessageHistory(messageHistory.filter(msg => msg.id !== campaignId))
      } else {
        alert(data.message || "Failed to delete campaign")
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
      alert("Failed to delete campaign")
    }
  }

  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    setSelectedDevices(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(deviceId)
      } else {
        next.delete(deviceId)
      }
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(new Set(devices.map(d => d.id)))
    } else {
      setSelectedDevices(new Set())
    }
  }

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationBody) {
      alert("Please fill in title and body")
      return
    }

    if (!sendToAll && selectedDevices.size === 0) {
      alert("Please select devices or choose to send to all")
      return
    }

    setSending(true)
    setSendResult(null)

    try {
      let parsedData = null
      if (notificationData.trim()) {
        try {
          parsedData = JSON.parse(notificationData)
        } catch (e) {
          alert("Invalid JSON in data field")
          setSending(false)
          return
        }
      }

      const response = await fetch("/admin/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          data: parsedData,
          device_ids: sendToAll ? undefined : Array.from(selectedDevices),
          send_to_all: sendToAll
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const result = data.data
        setSendResult(result)
        
        // Campaign is automatically saved to database by the API
        // Always refresh history to show the new campaign
        fetchCampaigns()
        
        // Don't reset form immediately - let user see the result
        // They can close manually or send another
      } else {
        alert(`Failed to send: ${data.message}`)
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      alert("Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateToken = (token: string, length: number = 20) => {
    return token.length > length ? `${token.substring(0, length)}...` : token
  }

  const getPlatformBadgeVariant = (platform: string) => {
    switch (platform) {
      case "ios":
        return "blue"
      case "android":
        return "green"
      case "web":
        return "purple"
      default:
        return "grey"
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <BellAlert className="w-6 h-6" />
          <Heading level="h2">FCM Device Management</Heading>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            <Clock className="w-4 h-4 mr-2" />
            {showHistory ? "Hide" : "Show"} History ({messageHistory.length})
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: 'orange', color: 'red', padding: '10px 20px' }}
            onClick={() => {
              setShowSendDrawer(true)
              setSendResult(null)
              // Reset form when opening drawer
              setNotificationTitle("")
              setNotificationBody("")
              setNotificationData("")
              setSendToAll(false)
              setSelectedDevices(new Set())
            }}
            disabled={devices.length === 0}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 flex items-center gap-4">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <Select.Trigger>
            <Select.Value placeholder="Filter by platform" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Platforms</Select.Item>
            <Select.Item value="ios">iOS</Select.Item>
            <Select.Item value="android">Android</Select.Item>
            <Select.Item value="web">Web</Select.Item>
          </Select.Content>
        </Select>

        <Text size="small" className="text-ui-fg-subtle">
          {devices.length} device(s) registered
        </Text>
      </div>

      {/* Message History */}
      {showHistory && (
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <Heading level="h3">Campaign History</Heading>
            <Button
              variant="transparent"
              size="small"
              onClick={fetchCampaigns}
              disabled={loadingHistory}
            >
              {loadingHistory ? "Loading..." : "Refresh"}
            </Button>
          </div>
          {loadingHistory ? (
            <Text className="text-ui-fg-subtle">Loading campaigns...</Text>
          ) : messageHistory.length === 0 ? (
            <Text className="text-ui-fg-subtle">No campaigns sent yet</Text>
          ) : (
            <div className="space-y-3">
              {messageHistory.map((msg) => (
                <div key={msg.id} className="p-4 bg-ui-bg-subtle rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Text weight="plus">{msg.title}</Text>
                        <Badge color={msg.failed_count > 0 ? "red" : "green"}>
                          {msg.success_count} sent, {msg.failed_count} failed
                        </Badge>
                      </div>
                      <Text size="small" className="text-ui-fg-subtle mb-2">
                        {msg.body}
                      </Text>
                      <div className="flex items-center gap-4 text-xs text-ui-fg-subtle">
                        <span>{formatDate(msg.sentAt)}</span>
                        <span>•</span>
                        <span>{msg.sendToAll ? `All devices (${msg.deviceCount})` : `${msg.deviceCount} selected device(s)`}</span>
                      </div>
                      {msg.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-ui-fg-subtle cursor-pointer">Show data payload</summary>
                          <Code className="text-xs block mt-2 p-2 bg-ui-bg-base rounded">
                            {JSON.stringify(msg.data, null, 2)}
                          </Code>
                        </details>
                      )}
                      {msg.results && msg.results.length > 0 && msg.failed_count > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-ui-fg-subtle cursor-pointer">Show failed devices ({msg.failed_count})</summary>
                          <div className="mt-2 space-y-1">
                            {msg.results
                              .filter((r: any) => !r.success)
                              .map((r: any, idx: number) => (
                                <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                  <Text size="small" className="text-red-600 dark:text-red-400">
                                    Device {r.device_id}: {r.error || "Unknown error"}
                                  </Text>
                                </div>
                              ))}
                          </div>
                        </details>
                      )}
                    </div>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleDeleteCampaign(msg.id)}
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Device Table */}
      {loading ? (
        <div className="px-6 py-12 text-center">
          <Text>Loading devices...</Text>
        </div>
      ) : devices.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <BellAlert className="w-12 h-12 mx-auto mb-4 text-ui-fg-muted" />
          <Text className="text-ui-fg-subtle">No devices registered yet</Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <Checkbox
                  checked={selectedDevices.size === devices.length && devices.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </Table.HeaderCell>
              <Table.HeaderCell>Token</Table.HeaderCell>
              <Table.HeaderCell>Platform</Table.HeaderCell>
              <Table.HeaderCell>App Version</Table.HeaderCell>
              <Table.HeaderCell>Customer ID</Table.HeaderCell>
              <Table.HeaderCell>Registered</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {devices.map((device) => (
              <Table.Row key={device.id}>
                <Table.Cell>
                  <Checkbox
                    checked={selectedDevices.has(device.id)}
                    onCheckedChange={(checked) => handleSelectDevice(device.id, checked as boolean)}
                  />
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="font-mono">
                    {truncateToken(device.token)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={getPlatformBadgeVariant(device.platform)}>
                    {device.platform.toUpperCase()}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">
                    {device.app_version || "N/A"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="font-mono">
                    {device.customer_id ? truncateToken(device.customer_id, 12) : "N/A"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">
                    {formatDate(device.created_at)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => setShowDeviceDetails(device)}
                    >
                      View
                    </Button>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleDeleteDevice(device.id)}
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* Send Notification Drawer */}
      <Drawer open={showSendDrawer} onOpenChange={setShowSendDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Send Push Notification</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <div className="space-y-4">
              <div>
                <label className="text-ui-fg-subtle text-sm mb-2 block">Target</label>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={sendToAll}
                    onCheckedChange={checked => setSendToAll(checked === true)}
                  />
                  <Text>Send to all devices ({devices.length})</Text>
                </div>
                {!sendToAll && (
                  <Text size="small" className="text-ui-fg-subtle mt-2">
                    {selectedDevices.size} device(s) selected
                  </Text>
                )}
              </div>

              <div>
                <label className="text-ui-fg-subtle text-sm mb-2 block">Title *</label>
                <Input
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="text-ui-fg-subtle text-sm mb-2 block">Body *</label>
                <Textarea
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="Notification message"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-ui-fg-subtle text-sm mb-2 block">Data (JSON, optional)</label>
                <Textarea
                  value={notificationData}
                  onChange={(e) => setNotificationData(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              {sendResult && (
                <div className={`p-4 rounded-lg border ${
                  sendResult.failed_count > 0 
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" 
                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {sendResult.failed_count > 0 ? (
                      <XCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                    <Text weight="plus">Send Results</Text>
                  </div>
                  <div className="space-y-1">
                    <Text size="small">
                      <strong>Success:</strong> {sendResult.success_count} | <strong>Failed:</strong> {sendResult.failed_count}
                    </Text>
                    {sendResult.failed_count > 0 && sendResult.results && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-ui-fg-subtle">Show failed devices</summary>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {sendResult.results
                            .filter((r: any) => !r.success)
                            .map((r: any, idx: number) => (
                              <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <Text size="small" className="text-red-600 dark:text-red-400">
                                  {r.device_id}: {r.error || "Unknown error"}
                                </Text>
                              </div>
                            ))}
                        </div>
                      </details>
                    )}
                  </div>
                  <Text size="small" className="text-ui-fg-subtle mt-2">
                    This message has been saved to history.
                  </Text>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={handleSendNotification}
                  disabled={sending || !notificationTitle || !notificationBody}
                >
                  {sending ? "Sending..." : "Send Notification"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowSendDrawer(false)
                    setSendResult(null)
                    setNotificationTitle("")
                    setNotificationBody("")
                    setNotificationData("")
                    setSendToAll(false)
                    setSelectedDevices(new Set())
                  }}
                >
                  {sendResult ? "Close" : "Cancel"}
                </Button>
                {sendResult && (
                  <Button
                    variant="transparent"
                    onClick={() => {
                      setNotificationTitle("")
                      setNotificationBody("")
                      setNotificationData("")
                      setSendResult(null)
                      setSendToAll(false)
                      setSelectedDevices(new Set())
                    }}
                  >
                    Send Another
                  </Button>
                )}
              </div>
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>

      {/* Device Details Drawer */}
      <Drawer open={!!showDeviceDetails} onOpenChange={(open) => !open && setShowDeviceDetails(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Device Details</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            {showDeviceDetails && (
              <div className="space-y-4">
                <div>
                  <label className="text-ui-fg-subtle text-sm mb-2 block">Token</label>
                  <Code className="text-xs break-all">{showDeviceDetails.token}</Code>
                </div>
                <div>
                  <label className="text-ui-fg-subtle text-sm mb-2 block">Platform</label>
                  <Badge color={getPlatformBadgeVariant(showDeviceDetails.platform)}>
                    {showDeviceDetails.platform.toUpperCase()}
                  </Badge>
                </div>
                {showDeviceDetails.app_version && (
                  <div>
                    <label className="text-ui-fg-subtle text-sm mb-2 block">App Version</label>
                    <Text>{showDeviceDetails.app_version}</Text>
                  </div>
                )}
                {showDeviceDetails.customer_id && (
                  <div>
                    <label className="text-ui-fg-subtle text-sm mb-2 block">Customer ID</label>
                    <Code className="text-xs">{showDeviceDetails.customer_id}</Code>
                  </div>
                )}
                {showDeviceDetails.device_info && (
                  <div>
                    <label className="text-ui-fg-subtle text-sm mb-2 block">Device Info</label>
                    <Code className="text-xs block p-3 bg-ui-bg-subtle rounded">
                      {JSON.stringify(showDeviceDetails.device_info, null, 2)}
                    </Code>
                  </div>
                )}
                <div>
                  <label className="text-ui-fg-subtle text-sm mb-2 block">Created</label>
                  <Text>{formatDate(showDeviceDetails.created_at)}</Text>
                </div>
                <div>
                  <label className="text-ui-fg-subtle text-sm mb-2 block">Updated</label>
                  <Text>{formatDate(showDeviceDetails.updated_at)}</Text>
                </div>
              </div>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "FCM",
  icon: BellAlert,
})

export default FCMPage
