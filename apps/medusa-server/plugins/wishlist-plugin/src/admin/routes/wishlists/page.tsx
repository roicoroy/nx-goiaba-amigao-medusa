import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { Heart, User, ShoppingBag, ArrowUpRightOnBox } from "@medusajs/icons"

type WishlistItem = {
  id: string
  product_variant_id: string
  product_title?: string
  product_price?: number
  product_image?: string
}

type Wishlist = {
  id: string
  customer_id: string
  customer_name?: string
  customer_email?: string
  items_count: number
  total_value: number
  created_at: string
  updated_at: string
  items: WishlistItem[]
}

const WishlistsPage = () => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedWishlist, setExpandedWishlist] = useState<string | null>(null)

  useEffect(() => {
    fetchWishlists()
  }, [])

  const fetchWishlists = async () => {
    try {
      const response = await fetch("/admin/wishlists")
      const data = await response.json()
      if (data.success) {
        setWishlists(data.data.wishlists)
      }
    } catch (error) {
      console.error("Error fetching wishlists:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWishlistDetails = (wishlistId: string) => {
    setExpandedWishlist(expandedWishlist === wishlistId ? null : wishlistId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const navigateToCustomer = (customerId: string) => {
    // Navigate to customer detail page in Medusa admin
    // Use the correct Medusa admin path structure
    window.location.href = `/app/customers/${customerId}`
  }

  if (loading) {
    return (
      <Container>
        <Text>Loading wishlists...</Text>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-red-500" />
          <Heading level="h1">Customer Wishlists</Heading>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <Text size="small" className="text-ui-fg-subtle">Total Wishlists</Text>
            <Text weight="plus">{wishlists.length}</Text>
          </div>
          <div className="text-right">
            <Text size="small" className="text-ui-fg-subtle">Total Value</Text>
            <Text weight="plus">
              {formatCurrency(wishlists.reduce((sum, w) => sum + w.total_value, 0))}
            </Text>
          </div>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Items</Table.HeaderCell>
            <Table.HeaderCell>Total Value</Table.HeaderCell>
            <Table.HeaderCell>Created</Table.HeaderCell>
            <Table.HeaderCell>Last Updated</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {wishlists.map((wishlist) => (
            <>
              <Table.Row key={wishlist.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-ui-bg-field rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <Text weight="plus">{wishlist.customer_name || `Customer ${wishlist.customer_id.slice(-4)}`}</Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        ID: {wishlist.customer_id.slice(-8)}
                      </Text>
                    </div>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => navigateToCustomer(wishlist.customer_id)}
                      className="ml-2"
                    >
                      <ArrowUpRightOnBox className="w-4 h-4" />
                    </Button>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <Badge variant="neutral" size="small">
                      {wishlist.items_count} items
                    </Badge>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Text weight="plus">{formatCurrency(wishlist.total_value)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{formatDate(wishlist.created_at)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{formatDate(wishlist.updated_at)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => toggleWishlistDetails(wishlist.id)}
                    >
                      {expandedWishlist === wishlist.id ? "Hide Items" : "View Items"}
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => navigateToCustomer(wishlist.customer_id)}
                    >
                      View Customer
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
              
              {expandedWishlist === wishlist.id && (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <div className="p-4 bg-ui-bg-subtle rounded-lg">
                      <Text weight="plus" className="mb-3">Wishlist Items:</Text>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlist.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded border">
                            <div className="w-12 h-12 bg-ui-bg-field rounded flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <Text size="small" weight="plus">
                                {item.product_title || `Product ${item.product_variant_id.slice(-4)}`}
                              </Text>
                              <Text size="small" className="text-ui-fg-subtle">
                                Variant: {item.product_variant_id.slice(-8)}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </>
          ))}
        </Table.Body>
      </Table>

      {wishlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Heart className="w-12 h-12 text-ui-fg-muted mb-4" />
          <Text className="text-ui-fg-subtle">No wishlists found</Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Wishlists",
  icon: Heart,
})

export default WishlistsPage