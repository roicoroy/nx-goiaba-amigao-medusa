import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { Heart, ShoppingBag, Trash, Plus } from "@medusajs/icons"
import { 
  DetailWidgetProps, 
  AdminCustomer,
} from "@medusajs/framework/types"

type WishlistItem = {
  id: string
  product_variant_id: string
  wishlist_id: string
  created_at: string
  updated_at: string
  product_variant: {
    id: string
    title: string
    sku: string
    product_id: string
    product: {
      id: string
      title: string
      thumbnail: string
      handle: string
    }
  }
}

type WishlistResponse = {
  success: boolean
  data: {
    wishlist: {
      id: string
      customer_id: string
      sales_channel_id: string
      created_at: string
      updated_at: string
    } | null
    items: WishlistItem[]
    count: number
  }
}

const CustomerWishlistWidget = ({ 
  data: customer,
}: DetailWidgetProps<AdminCustomer>) => {
  const [expandedItems, setExpandedItems] = useState(false)
  const [data, setData] = useState<WishlistResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const fetchWishlist = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/admin/customers/${customer.id}/wishlist`, {
        credentials: "include"
      })
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [customer.id])

  const handleRemoveItemMutation = async (itemId: string) => {
    try {
      setIsRemoving(true)
      await fetch(`/admin/customers/${customer.id}/wishlist?itemId=${itemId}`, {
        method: "DELETE",
        credentials: "include"
      })
      await fetchWishlist()
    } catch (err) {
      console.error("Failed to remove item:", err)
    } finally {
      setIsRemoving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleRemoveItem = (itemId: string) => {
    if (confirm("Are you sure you want to remove this item from the customer's wishlist?")) {
      handleRemoveItemMutation(itemId)
    }
  }

  const handleViewProduct = (productId: string) => {
    // Navigate to product page - this would need proper routing
    window.open(`/app/products/${productId}`, '_blank')
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <Heading level="h2">Wishlist</Heading>
          </div>
        </div>
        <div className="px-6 py-4">
          <Text>Loading wishlist...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <Heading level="h2">Wishlist</Heading>
          </div>
        </div>
        <div className="px-6 py-4">
          <Text className="text-red-600">Error loading wishlist</Text>
        </div>
      </Container>
    )
  }

  const wishlistData = data?.data
  const items = wishlistData?.items || []
  const hasWishlist = wishlistData?.wishlist !== null
  const itemCount = wishlistData?.count || 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <Heading level="h2">Wishlist</Heading>
          {itemCount > 0 && (
            <Badge variant="neutral" size="small">
              {itemCount} items
            </Badge>
          )}
        </div>
        {hasWishlist && itemCount > 0 && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setExpandedItems(!expandedItems)}
          >
            {expandedItems ? "Hide Items" : "View Items"}
          </Button>
        )}
      </div>

      <div className="px-6 py-4">
        {!hasWishlist ? (
          <Text className="text-ui-fg-subtle">
            This customer hasn't created a wishlist yet.
          </Text>
        ) : itemCount === 0 ? (
          <Text className="text-ui-fg-subtle">
            Customer's wishlist is empty.
          </Text>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text>
                Customer has {itemCount} item{itemCount !== 1 ? 's' : ''} in their wishlist
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                Created {formatDate(wishlistData.wishlist.created_at)}
              </Text>
            </div>

            {expandedItems && (
              <div className="space-y-3 border-t pt-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg">
                    <div className="w-12 h-12 bg-ui-bg-field rounded flex items-center justify-center overflow-hidden">
                      <img 
                        src={item.product_variant.product.thumbnail} 
                        alt={item.product_variant.product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling.style.display = 'flex'
                        }}
                      />
                      <ShoppingBag className="w-6 h-6 text-ui-fg-muted" style={{display: 'none'}} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Text weight="plus" size="small">
                            {item.product_variant.product.title}
                          </Text>
                          <Text size="small" className="text-ui-fg-subtle">
                            Variant: {item.product_variant.title}
                          </Text>
                          <Text size="small" className="text-ui-fg-muted">
                            SKU: {item.product_variant.sku}
                          </Text>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleViewProduct(item.product_variant.product_id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isRemoving}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Text size="small" className="text-ui-fg-muted mt-1">
                        Added {formatDate(item.created_at)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
})

export default CustomerWishlistWidget