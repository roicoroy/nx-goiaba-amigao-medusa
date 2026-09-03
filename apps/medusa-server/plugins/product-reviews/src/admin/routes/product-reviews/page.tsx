import { defineRouteConfig } from '@medusajs/admin-sdk';
import { Star } from '@medusajs/icons';
import { Button, Container, DatePicker, Heading, Input, Select, toast } from '@medusajs/ui';
import { useEffect, useState } from 'react';
import { EnhancedProductReviewDataTable } from '../../components/molecules/EnhancedProductReviewDataTable';
import { useAdminProducts } from '../../hooks/products';
import { productReviewClient } from '../../lib/client';

const ProductReviewsPage = () => {
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const pageSize = 10; // Fixed 10 items per page

  // Fetch products for filter dropdown
  const { data: productsData } = useAdminProducts({ limit: 100 });
  const products = productsData?.products || [];

  // Refresh all product review stats
  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    try {
      const data = await productReviewClient.admin.productReviewStats.refresh();

      toast.success('Success', {
        description: data.message || `Refreshed stats for ${data.refreshed} products`,
      });
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to refresh review statistics',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Build query based on filters
  const query: any = {
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  };

  if (productFilter && productFilter !== 'all') {
    query.product_id = productFilter;
  }
  if (statusFilter && statusFilter !== 'all') {
    query.status = statusFilter;
  }
  if (ratingFilter && ratingFilter !== 'all') {
    query.rating = parseInt(ratingFilter);
  }
  if (dateFrom) {
    query.created_at_gte = dateFrom.toISOString();
  }
  if (dateTo) {
    query.created_at_lte = dateTo.toISOString();
  }
  if (searchQuery) {
    query.q = searchQuery;
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [productFilter, statusFilter, ratingFilter, dateFrom, dateTo, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ui-bg-subtle">
            <Star className="h-5 w-5 text-ui-fg-subtle" />
          </div>
          <Heading level="h1" className="text-ui-fg-base">
            Product Reviews
          </Heading>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={handleRefreshStats}
          isLoading={isRefreshing}
        >
          Refresh Stats
        </Button>
      </div>

      {/* Filter Section */}
      <Container className="bg-ui-bg-base border border-ui-border-base rounded-lg p-6">
        <Heading level="h2" className="text-sm font-medium text-ui-fg-subtle mb-4">
          Filters
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Product Filter */}
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle mb-1.5 block">Product</label>
            <Select
              value={productFilter}
              onValueChange={setProductFilter}
            >
              <Select.Trigger>
                <Select.Value placeholder="All Products" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Products</Select.Item>
                {products.map((product) => (
                  <Select.Item key={product.id} value={product.id}>
                    {product.title}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle mb-1.5 block">Status</label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <Select.Trigger>
                <Select.Value placeholder="All Status" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Status</Select.Item>
                <Select.Item value="approved">Approved</Select.Item>
                <Select.Item value="pending">Pending</Select.Item>
                <Select.Item value="flagged">Flagged</Select.Item>
              </Select.Content>
            </Select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle mb-1.5 block">Rating</label>
            <Select
              value={ratingFilter}
              onValueChange={setRatingFilter}
            >
              <Select.Trigger>
                <Select.Value placeholder="All Ratings" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Ratings</Select.Item>
                <Select.Item value="5">5 Stars</Select.Item>
                <Select.Item value="4">4 Stars</Select.Item>
                <Select.Item value="3">3 Stars</Select.Item>
                <Select.Item value="2">2 Stars</Select.Item>
                <Select.Item value="1">1 Star</Select.Item>
              </Select.Content>
            </Select>
          </div>

          {/* Date From Filter */}
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle mb-1.5 block">Date From</label>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              granularity="day"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle mb-1.5 block">Date To</label>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              granularity="day"
            />
          </div>

          {/* Search Input */}
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle mb-1.5 block">Search</label>
            <Input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4 pt-4 border-t border-ui-border-base flex justify-end">
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setProductFilter('all');
              setStatusFilter('all');
              setRatingFilter('all');
              setDateFrom(null);
              setDateTo(null);
              setSearchQuery('');
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Container>

      <EnhancedProductReviewDataTable
        query={query}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        showColumns={[
          'product',
          'rating',
          'status',
          'created_at',
          'customer',
          'review',
          'images',
          'response',
          'verified',
          'actions'
        ]}
      />
    </div>
  );
};

export const config = defineRouteConfig({
  label: 'Reviews',
  icon: Star,
});

export default ProductReviewsPage;