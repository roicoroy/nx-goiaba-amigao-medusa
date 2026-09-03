import { HttpTypes } from "@medusajs/framework/types";
import { medusa } from "../lib/client";
import { useApiCall } from "../utils/use-api-call";

export const useAdminProducts = (query?: HttpTypes.AdminProductFilters) => {
  const fetchProducts = async () => {
    return medusa.admin.product.list(query);
  };

  const { data, isLoading, error } = useApiCall(fetchProducts, [JSON.stringify(query)]);

  return {
    products: data?.products || [],
    count: data?.count || 0,
    isLoading,
    error,
    data,
  };
};