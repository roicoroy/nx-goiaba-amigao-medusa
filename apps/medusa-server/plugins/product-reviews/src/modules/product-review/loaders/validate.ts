import { LoaderOptions } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { ModuleOptions } from "../service"

export default async function validationLoader({
  options,
}: LoaderOptions<ModuleOptions>) {
  // Basic validation without zod
  if (options?.defaultReviewStatus) {
    const validStatuses = ['pending', 'approved', 'flagged'];
    if (!validStatuses.includes(options.defaultReviewStatus)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Product Review Module. Invalid defaultReviewStatus: ${options.defaultReviewStatus}. Must be one of: ${validStatuses.join(', ')}`
      )
    }
  }
}
