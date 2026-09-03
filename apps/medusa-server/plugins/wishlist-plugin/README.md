# Medusa Wishlist Plugin

A wishlist plugin for Medusa v2 that allows customers to save products for later purchase.

## Features

- ✅ Create and manage customer wishlists
- ✅ Add/remove products from wishlist
- ✅ Share wishlists via tokens
- ✅ Full product details including images in API responses
- ✅ Admin panel integration
- ✅ Support for Cloudinary and other image providers

## API Endpoints

### Customer Wishlist
- `GET /store/customers/me/wishlists` - Get customer's wishlist
- `POST /store/customers/me/wishlists` - Create a new wishlist
- `POST /store/customers/me/wishlists/items` - Add item to wishlist
- `DELETE /store/customers/me/wishlists/items/{id}` - Remove item from wishlist

### Shared Wishlist
- `GET /store/wishlists/{token}` - Get shared wishlist by token
- `POST /store/customers/me/wishlists/share` - Generate share token

### Admin
- `GET /admin/products/{id}/wishlist` - Get wishlist count for product

## Response Format

The wishlist API returns complete product information including images:

```json
{
  "wishlist": {
    "id": "wishlist_123",
    "customer_id": "cus_123",
    "items": [
      {
        "id": "item_123",
        "product_variant_id": "variant_123",
        "product_variant": {
          "id": "variant_123",
          "title": "Size S",
          "sku": "PRODUCT-S",
          "product": {
            "id": "prod_123",
            "title": "Product Name",
            "description": "Product description",
            "handle": "product-handle",
            "thumbnail": "https://example.com/thumb.jpg",
            "images": [
              {
                "id": "img_123",
                "url": "https://example.com/image1.jpg",
                "rank": 0
              }
            ]
          }
        }
      }
    ]
  }
}
```

## Development

### Making Changes

1. Edit files in `src/` directory
2. Build and deploy: `npm run deploy`
3. Update main project: `cd .. && npx yalc update`
4. Restart Medusa server

### Quick Commands

```bash
# Build and publish plugin
npm run deploy

# From main project - update plugin and restart
npm run update-wishlist-plugin
npm run dev
```

## Installation

This plugin is installed locally using yalc. See the main project's `WISHLIST_PLUGIN_DEVELOPMENT.md` for detailed development instructions.

## Dependencies

- Medusa v2.11+
- jsonwebtoken (for share tokens)
- TypeScript support

## License

MIT