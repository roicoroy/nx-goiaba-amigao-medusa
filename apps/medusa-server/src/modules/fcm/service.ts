import { MedusaService, InjectManager, MedusaContext } from "@medusajs/framework/utils"
import { FcmDeviceToken } from "./models/fcm-device-token"
import { FcmCampaign } from "./models/fcm-campaign"
import { Context } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"

export default class FcmModuleService extends MedusaService({
  FcmDeviceToken,
  FcmCampaign,
}) {
  @InjectManager()
  async findByToken(
    token: string,
    @MedusaContext() context: Context<EntityManager> = {}
  ) {
    const [devices] = await this.listFcmDeviceTokens(
      { token },
      {},
      context
    )
    return devices?.[0] || null
  }

  @InjectManager()
  async findByCustomer(
    customerId: string,
    @MedusaContext() context: Context<EntityManager> = {}
  ) {
    const [devices] = await this.listFcmDeviceTokens(
      { customer_id: customerId },
      {},
      context
    )
    return devices || []
  }

  @InjectManager()
  async deleteByToken(
    token: string,
    @MedusaContext() context: Context<EntityManager> = {}
  ) {
    const device = await this.findByToken(token, context)
    if (device) {
      await this.deleteFcmDeviceTokens(device.id, context)
      return true
    }
    return false
  }

  @InjectManager()
  async createCampaign(
    campaignData: {
      title: string
      body: string
      data?: any
      send_to_all: boolean
      device_ids?: any // JSON field, can be array or null
      device_count: number
      success_count: number
      failed_count: number
      results?: any[]
      sent_by?: string
    },
    @MedusaContext() context: Context<EntityManager> = {}
  ) {
    const [campaign] = await this.createFcmCampaigns([campaignData as any], context)
    return campaign
  }

  @InjectManager()
  async listCampaigns(
    filters: any = {},
    options: any = {},
    @MedusaContext() context: Context<EntityManager> = {}
  ) {
    return await this.listAndCountFcmCampaigns(filters, options, context)
  }

  @InjectManager()
  async deleteCampaign(
    campaignId: string,
    @MedusaContext() context: Context<EntityManager> = {}
  ) {
    await this.deleteFcmCampaigns(campaignId, context)
    return true
  }
}

