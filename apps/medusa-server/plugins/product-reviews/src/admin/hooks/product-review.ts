import { useCallback, useEffect, useState } from 'react';
import {
  AdminCreateProductReviewResponseDTO,
  AdminListProductReviewsQuery,
  AdminListProductReviewsResponse,
  AdminUpdateProductReviewResponseDTO,
} from '../../types/admin';
import { sdk } from '../lib/client';

export const useAdminListProductReviews = (query: AdminListProductReviewsQuery) => {
  const [data, setData] = useState<AdminListProductReviewsResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await sdk.admin.productReviews.list(query);
        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(query)]);

  return { data, isLoading, error };
};

export const useAdminCreateProductReviewResponseMutation = (reviewId: string) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (body: AdminCreateProductReviewResponseDTO) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await sdk.admin.productReviews.createResponse(reviewId, body);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [reviewId]);

  return { mutate, isPending, error };
};

export const useAdminUpdateProductReviewResponseMutation = (reviewId: string) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (body: AdminUpdateProductReviewResponseDTO) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await sdk.admin.productReviews.updateResponse(reviewId, body);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [reviewId]);

  return { mutate, isPending, error };
};

  export const useAdminUpdateProductReviewStatusMutation = () => {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = useCallback(async (
      {
        reviewId,
        status
      }: {
        reviewId: string;
        status: 'pending' | 'approved' | 'flagged';
      },
      options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await sdk.admin.productReviews.updateStatus(reviewId, status);
        options?.onSuccess?.();
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    }, []);

    return { mutate, isPending, error };
  };

  export const useAdminUpdateProductReviewVerifiedMutation = () => {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = useCallback(async (
      {
        reviewId,
        verified
      }: {
        reviewId: string;
        verified: boolean;
      },
      options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await sdk.admin.productReviews.updateVerified(reviewId, verified);
        
        options?.onSuccess?.();
        return result;
      } catch (err) {
        setError(err as Error);
        options?.onError?.(err as Error);
        throw err;
      } finally {
        setIsPending(false);
      }
    }, []);

    return { mutate, isPending, error };
  };