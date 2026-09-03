import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import { CalculatedShippingOptionPrice, CalculateShippingOptionPriceDTO, CartAddressDTO, CartLineItemDTO, CreateShippingOptionDTO, FulfillmentOption, OrderLineItemDTO, StockLocationAddressDTO } from "@medusajs/framework/types"
import { ShipStationClient } from "./client"
import { GetShippingRatesResponse, Rate, ShipStationAddress } from "./types"

export type ShipStationOptions = {
  api_key: string
}

class ShipStationProviderService extends AbstractFulfillmentProviderService {
  static identifier = "shipstation"
  protected options_: ShipStationOptions
  protected client: ShipStationClient

  constructor({ }, options: ShipStationOptions) {
    super()

    this.options_ = options
    this.client = new ShipStationClient(options)
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    const { carriers } = await this.client.getCarriers()
    const fulfillmentOptions: FulfillmentOption[] = []

    carriers
      .filter((carrier) => !carrier.disabled_by_billing_plan)
      .forEach((carrier) => {
        carrier.services.forEach((service) => {
          fulfillmentOptions.push({
            id: `${carrier.carrier_id}__${service.service_code}`,
            name: service.name,
            carrier_id: carrier.carrier_id,
            carrier_service_code: service.service_code
          })
        })
      })

    return fulfillmentOptions
  }

  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    return true
  }

  private async createShipment({
    carrier_id,
    carrier_service_code,
    from_address,
    to_address,
    items,
    currency_code
  }: {
    carrier_id: string
    carrier_service_code: string
    from_address?: {
      name?: string
      address?: Omit<StockLocationAddressDTO, "created_at" | "updated_at" | "deleted_at">
    },
    to_address?: Omit<CartAddressDTO, "created_at" | "updated_at" | "deleted_at" | "id">,
    items: CartLineItemDTO[] | OrderLineItemDTO[],
    currency_code: string
  }): Promise<GetShippingRatesResponse> {
    if (!from_address?.address) {
      // Log debugging info to help diagnose the issue
      console.error("ShipStation: from_location.address is missing", {
        has_from_address: !!from_address,
        from_address_name: from_address?.name,
        from_address_keys: from_address ? Object.keys(from_address) : [],
        has_address: !!from_address?.address,
        address_keys: from_address?.address ? Object.keys(from_address.address) : []
      })
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "from_location.address is required to calculate shipping rate. Please ensure the fulfillment set's stock location has a complete address configured in Settings → Locations."
      )
    }
    // Validate postal_code - must be non-empty and valid
    const postalCode = from_address?.address?.postal_code?.trim()
    const countryCode = (from_address?.address?.country_code || "us").toLowerCase()
    
    // Default postal codes by country
    const defaultPostalCodes: Record<string, string> = {
      us: "54302",
      gb: "SW1A 1AA", // London
      de: "10115", // Berlin
      dk: "1050", // Copenhagen
      se: "111 22", // Stockholm
      fr: "75001", // Paris
      es: "28001", // Madrid
      it: "00118" // Rome
    }
    
    const ship_from: ShipStationAddress = {
      name: from_address?.name || "test",
      phone: from_address?.address?.phone || "1234",
      address_line1: from_address?.address?.address_1 || "2220 Main St",
      city_locality: from_address?.address?.city || "Green Bay",
      state_province: from_address?.address?.province || "WI",
      postal_code: (postalCode && postalCode.length > 0) ? postalCode : (defaultPostalCodes[countryCode] || "54302"),
      country_code: countryCode,
      address_residential_indicator: "unknown"
    }
    if (!to_address) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "shipping_address is required to calculate shipping rate"
      )
    }

    const ship_to: ShipStationAddress = {
      name: `${to_address.first_name} ${to_address.last_name}`,
      phone: to_address.phone || "",
      address_line1: to_address.address_1 || "",
      city_locality: to_address.city || "",
      state_province: to_address.province || "",
      postal_code: to_address.postal_code || "",
      country_code: to_address.country_code || "",
      address_residential_indicator: "unknown"
    }

    const packageWeight = items.reduce((sum, item) => {
      // @ts-ignore
      return sum + (item.variant.weight || 0)
    }, 0)

    // ShipStation maximum allowed dimensions (in cm)
    const MAX_LENGTH = 35
    const MAX_WIDTH = 23
    const MAX_HEIGHT = 2.5

    // Default dimensions in centimeters if no dimensions are available
    // Must be within ShipStation limits
    const defaultLength = 30  // 30 cm (within 35 cm limit)
    const defaultWidth = 20   // 20 cm (within 23 cm limit)
    const defaultHeight = 2.5 // 2.5 cm (at max limit)

    // Calculate package dimensions - use the maximum dimension from all items
    // Package dimensions represent the outer box size, not the sum of items
    // @ts-ignore
    const maxLength = items.reduce((max, item) => Math.max(max, item.variant.length || 0), 0)
    // @ts-ignore
    const maxWidth = items.reduce((max, item) => Math.max(max, item.variant.width || 0), 0)
    // @ts-ignore
    const maxHeight = items.reduce((max, item) => Math.max(max, item.variant.height || 0), 0)

    // Use calculated dimensions or defaults, ensuring they're positive and within limits
    const packageLength = Math.min(Math.max(maxLength || defaultLength, 1), MAX_LENGTH)
    const packageWidth = Math.min(Math.max(maxWidth || defaultWidth, 1), MAX_WIDTH)
    const packageHeight = Math.min(Math.max(maxHeight || defaultHeight, 1), MAX_HEIGHT)

    return await this.client.getShippingRates({
      shipment: {
        carrier_id: carrier_id,
        service_code: carrier_service_code,
        ship_to,
        ship_from,
        validate_address: "no_validation",
        items: items?.map((item) => ({
          name: item.title,
          quantity: item.quantity,
          sku: item.variant_sku || ""
        })),
        packages: [{
          weight: {
            value: Math.max(packageWeight || 0.1, 0.1), // Ensure minimum weight
            unit: "kilogram"
          },
          dimensions: {
            length: packageLength,
            width: packageWidth,
            height: packageHeight,
            unit: "centimeter"
          }
        }],
        customs: {
          contents: "merchandise",
          non_delivery: "return_to_sender"
        }
      },
      rate_options: {
        carrier_ids: [carrier_id],
        service_codes: [carrier_service_code],
        preferred_currency: currency_code as string,
      }
    })
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const { shipment_id } = data as {
      shipment_id?: string
    } || {}
    const { carrier_id, carrier_service_code } = optionData as {
      carrier_id: string
      carrier_service_code: string
    }
    let rate: Rate | undefined

    if (!shipment_id) {
      // Log context structure for debugging
      if (!context.from_location?.address) {
        console.error("ShipStation: context.from_location.address is missing", {
          has_from_location: !!context.from_location,
          from_location_keys: context.from_location ? Object.keys(context.from_location) : [],
          context_keys: Object.keys(context)
        })
      }
      
      const shipment = await this.createShipment({
        carrier_id,
        carrier_service_code,
        from_address: {
          name: context.from_location?.name,
          address: context.from_location?.address
        },
        to_address: context.shipping_address,
        items: context.items || [],
        currency_code: context.currency_code as string
      })
      rate = shipment.rate_response.rates[0]
    } else {
      const rateResponse = await this.client.getShipmentRates(shipment_id)
      rate = rateResponse[0].rates[0]
    }

    const calculatedPrice = !rate ? 0 : rate.shipping_amount.amount + rate.insurance_amount.amount +
      rate.confirmation_amount.amount + rate.other_amount.amount +
      (rate.tax_amount?.amount || 0)

    return {
      calculated_amount: calculatedPrice,
      is_calculated_price_tax_inclusive: !!rate?.tax_amount
    }
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<any> {
    let { shipment_id } = data as {
      shipment_id?: string
    }

    if (!shipment_id) {
      const { carrier_id, carrier_service_code } = optionData as {
        carrier_id: string
        carrier_service_code: string
      }
      const shipment = await this.createShipment({
        carrier_id,
        carrier_service_code,
        from_address: {
          // @ts-ignore
          name: context.from_location?.name,
          // @ts-ignore
          address: context.from_location?.address
        },
        // @ts-ignore
        to_address: context.shipping_address,
        // @ts-ignore
        items: context.items || [],
        // @ts-ignore
        currency_code: context.currency_code
      })
      shipment_id = shipment.shipment_id
    }

    return {
      ...data,
      shipment_id
    }
  }

  async createFulfillment(
    data: object,
    items: object[],
    order: object | undefined,
    fulfillment: Record<string, unknown>
  ): Promise<any> {
    const { shipment_id } = data as {
      shipment_id: string
    }

    const originalShipment = await this.client.getShipment(shipment_id)

    const orderItemsToFulfill = []

    items.map((item) => {
      // @ts-ignore
      const orderItem = order.items.find((i) => i.id === item.line_item_id)

      if (!orderItem) {
        return
      }

      // @ts-ignore
      orderItemsToFulfill.push({
        ...orderItem,
        // @ts-ignore
        quantity: item.quantity
      })
    })

    const newShipment = await this.createShipment({
      carrier_id: originalShipment.carrier_id,
      carrier_service_code: originalShipment.service_code,
      from_address: {
        name: originalShipment.ship_from.name,
        address: {
          ...originalShipment.ship_from,
          address_1: originalShipment.ship_from.address_line1,
          city: originalShipment.ship_from.city_locality,
          province: originalShipment.ship_from.state_province,
        }
      },
      to_address: {
        ...originalShipment.ship_to,
        address_1: originalShipment.ship_to.address_line1,
        city: originalShipment.ship_to.city_locality,
        province: originalShipment.ship_to.state_province,
      },
      items: orderItemsToFulfill as OrderLineItemDTO[],
      // @ts-ignore
      currency_code: order.currency_code
    })

    const label = await this.client.purchaseLabelForShipment(newShipment.shipment_id)

    return {
      data: {
        ...(fulfillment.data as object || {}),
        label_id: label.label_id,
        shipment_id: label.shipment_id
      },
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    const { label_id, shipment_id } = data as {
      label_id: string
      shipment_id: string
    }

    await this.client.voidLabel(label_id)
    await this.client.cancelShipment(shipment_id)
  }

}

export default ShipStationProviderService