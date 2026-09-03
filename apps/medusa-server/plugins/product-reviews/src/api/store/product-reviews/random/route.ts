import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { z } from 'zod';
import type { ProductReview } from '../../../../modules/product-review/types/common';
import { listStoreProductReviewsRandomQuerySchema } from '../middlewares';

// Create type from the existing Zod schema
type RandomReviewsQueryParams = z.infer<typeof listStoreProductReviewsRandomQuerySchema>;

// Get random product reviews
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Parse query parameters - middleware has already validated and coerced these
  const queryParams = req.query as unknown as RandomReviewsQueryParams;
  const {
    withImages = 3,
    total = 6,
    status = "approved"
  } = queryParams;

  // Extract only the database filterable fields (exclude withImages, total, order, offset, limit)
  const { withImages: _, total: __, order: ___, offset: ____, limit: _____, ...filterableFields } = queryParams;

  // Get the reviews
  // Create filters object explicitly to avoid type issues with order property
  const filters: any = {
    ...filterableFields,
    // Only return approved reviews by default unless status is explicitly provided
    status,
  };
  // Remove order, offset, limit from filters if they exist (they should be in queryConfig, not filters)
  delete filters.order;
  delete filters.offset;
  delete filters.limit;

  const { data: product_reviews, metadata = { count: 0, skip: 0, take: 0 } } = await query.graph({
    entity: 'product_review',
    ...req.queryConfig,
    fields: ["id","content","name","title","created_at","rating","images.*","product.title","product.handle"],
    filters,
  });


  // Parameters are already validated and coerced by middleware
  const withImagesCount = withImages ?? 3;
  const totalCount = total ?? 6;

  if (product_reviews.length === 0) {
      return res.json({
        reviews: [],
        totalAvailable: 0,
        withImagesRequested: withImagesCount,
        totalRequested: totalCount,
        message: `No reviews found with status: ${status}`
      })
    }

    // Helper function to check if review has image media
    // Use any type for query result to avoid type compatibility issues with nested images array
    const hasImageMedia = (review: any): boolean => {
      return Boolean(review.images &&
        Array.isArray(review.images) &&
        review.images.length > 0 &&
        review.images.some((media: any) =>
          media && media.type && typeof media.type === 'string' && media.type.startsWith('image/')
        ))
    }

    // Separate reviews into those with and without image media
    const reviewsWithImageMedia = product_reviews.filter(hasImageMedia)
    const reviewsWithoutImageMedia = product_reviews.filter(review => !hasImageMedia(review))

    // Function to shuffle array using Fisher-Yates algorithm
    const shuffleArray = <T>(array: T[]): T[] => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    // Get the requested number of reviews with image media
    const actualWithImagesCount = Math.min(withImagesCount, reviewsWithImageMedia.length)
    const shuffledImageReviews = shuffleArray(reviewsWithImageMedia)
    const selectedImageReviews = shuffledImageReviews.slice(0, actualWithImagesCount)

    // Fill remaining count with reviews without image media
    const remainingCount = totalCount - selectedImageReviews.length
    const shuffledNonImageReviews = shuffleArray(reviewsWithoutImageMedia)
    const selectedNonImageReviews = shuffledNonImageReviews.slice(0, remainingCount)

    // Combine the selected reviews
    const randomReviews = [...selectedImageReviews, ...selectedNonImageReviews]

    const response = {
      reviews: randomReviews,
      totalAvailable: product_reviews.length,
      totalWithImageMediaAvailable: reviewsWithImageMedia.length,
      totalWithoutImageMediaAvailable: reviewsWithoutImageMedia.length,
      withImagesRequested: withImagesCount,
      totalRequested: totalCount,
      returned: randomReviews.length,
      selectedWithImageMedia: selectedImageReviews.length,
      selectedWithoutImageMedia: selectedNonImageReviews.length,
      status: status
    };

    res.json(response);
} 