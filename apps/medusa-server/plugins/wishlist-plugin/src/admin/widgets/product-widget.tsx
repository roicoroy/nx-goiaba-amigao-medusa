import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useState, useEffect } from "react"
import {
  DetailWidgetProps,
  AdminProduct,
} from "@medusajs/framework/types"

type WishlistResponse = {
  count: number
}

const ProductWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [data, setData] = useState<WishlistResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWishlistCount = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/admin/products/${product.id}/wishlist`, {
          credentials: "include"
        })
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error("Failed to fetch wishlist count:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWishlistCount()
  }, [product.id])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Wishlist</Heading>
      </div>
      <Text className="px-6 py-4">
        {isLoading ?
          "Loading..." : `This product is in ${data?.count || 0} wishlist(s).`
        }
      </Text>
    </Container>
  )
}


export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductWidget