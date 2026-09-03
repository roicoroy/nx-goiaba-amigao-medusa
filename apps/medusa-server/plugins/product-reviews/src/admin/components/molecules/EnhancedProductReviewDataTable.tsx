import { ChatBubble, Eye, CheckCircle, XCircle, Clock } from '@medusajs/icons';
import { Button, Table, Badge, Input } from '@medusajs/ui';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { useAdminListProductReviews, useAdminUpdateProductReviewStatusMutation, useAdminUpdateProductReviewVerifiedMutation } from '../../hooks/product-review';
import { ProductReviewResponseDrawer } from './ProductReviewResponseDrawer';
import { ProductReviewDetailsDrawer } from './ProductReviewDetailsDrawer';
import { Link } from 'react-router-dom';
import { ReviewStars } from '../atoms/review-stars';
import { AdminListProductReviewsQuery, AdminProductReview } from '../../../sdk/types';

interface EnhancedProductReviewDataTableProps {
  query: AdminListProductReviewsQuery;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  showColumns?: string[];
}

export const EnhancedProductReviewDataTable = ({
  query,
  currentPage,
  onPageChange,
  pageSize,
  showColumns = ['product', 'rating', 'status', 'created_at', 'customer', 'review', 'images', 'response', 'verified', 'actions']
}: EnhancedProductReviewDataTableProps) => {
  const [selectedReview, setSelectedReview] = useState<AdminProductReview | null>(null);
  const [selectedReviewForDetails, setSelectedReviewForDetails] = useState<AdminProductReview | null>(null);
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const [localReviews, setLocalReviews] = useState<AdminProductReview[]>([]);
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  const { mutate: updateStatus } = useAdminUpdateProductReviewStatusMutation();
  const { mutate: updateVerified } = useAdminUpdateProductReviewVerifiedMutation();


  const { data, isLoading } = useAdminListProductReviews(query);

  const reviews = localReviews.length > 0 ? localReviews : data?.product_reviews || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Update local reviews when data changes
  React.useEffect(() => {
    if (data?.product_reviews) {
      setLocalReviews(data.product_reviews);
    }
  }, [data?.product_reviews]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNumber = parseInt(pageInput);
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        onPageChange(pageNumber);
      } else {
        setPageInput(currentPage.toString());
      }
    }
  };

  const handlePageInputBlur = () => {
    const pageNumber = parseInt(pageInput);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // Update page input when current page changes externally
  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'flagged':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getNextStatus = (currentStatus: string): string => {
    const statusCycle = {
      approved: 'pending',
      pending: 'flagged',
      flagged: 'approved'
    };
    return statusCycle[currentStatus as keyof typeof statusCycle] || 'pending';
  };

  const getStatusBadge = (review: AdminProductReview) => {
    const colors = {
      approved: 'green',
      pending: 'orange',
      flagged: 'red'
    };
    const Icon = getStatusIcon(review.status);

    return (
      <Button
        variant="transparent"
        size="small"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const nextStatus = getNextStatus(review.status);

          // Update local state immediately for instant feedback
          setLocalReviews(prevReviews =>
            prevReviews.map(r =>
              r.id === review.id ? { ...r, status: nextStatus } : r
            )
          );

          // Then update the backend
          updateStatus({ reviewId: review.id, status: nextStatus }, {
            onSuccess: () => {
              // Status update successful - local state already updated
            },
            onError: () => {
              // Revert the optimistic update on error
              setLocalReviews(prevReviews =>
                prevReviews.map(r =>
                  r.id === review.id ? { ...r, status: review.status } : r
                )
              );
            }
          });
        }}
        className="flex items-center gap-1 hover:bg-ui-bg-subtle rounded px-2 py-1"
      >
        <Icon className="h-4 w-4" />
        <Badge color={colors[review.status as keyof typeof colors] || 'grey'} size="small">
          {review.status}
        </Badge>
      </Button>
    );
  };


  const getVerifiedIcon = (verified: boolean) => {
    switch (verified) {
      case true:
        return CheckCircle;
      case false:
        return XCircle;
      default:
        return XCircle;
    }
  };

  const getNextVerified = (verified: boolean): boolean => {
    return !verified;
  };
  const getVerifiedBadge = (review: AdminProductReview) => {
    const colors = {
      true: 'green',
      false: 'red',
    };
    const Icon = getVerifiedIcon(review.verified);

    return (
      <Button
        variant="transparent"
        size="small"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const nextVerified = getNextVerified(review.verified);

          // Update local state immediately for instant feedback
          setLocalReviews(prevReviews =>
            prevReviews.map(r =>
              r.id === review.id ? { ...r, verified: nextVerified } : r
            )
          );

          // Then update the backend
          updateVerified({ reviewId: review.id, verified: nextVerified }, {
            onSuccess: () => {
              // Status update successful - local state already updated
            },
            onError: () => {
              // Revert the optimistic update on error
              setLocalReviews(prevReviews =>
                prevReviews.map(r =>
                  r.id === review.id ? { ...r, verified: review.verified } : r
                )
              );
            }
          });
        }}
        className="flex items-center gap-1 hover:bg-ui-bg-subtle rounded px-2 py-1"
      >
        <Icon className="h-4 w-4" />
        <Badge color={colors[review.verified as unknown as keyof typeof colors] || 'grey'} size="small">
          {review.verified ? 'Verified' : 'Unverified'}
        </Badge>
      </Button>
    );
  };

  return (
    <>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <Table>
          <Table.Header>
            <Table.Row>
              {showColumns.includes('product') && <Table.HeaderCell>Product</Table.HeaderCell>}
              {showColumns.includes('rating') && <Table.HeaderCell>Rating</Table.HeaderCell>}
              {showColumns.includes('status') && <Table.HeaderCell>Status</Table.HeaderCell>}
              {showColumns.includes('created_at') && <Table.HeaderCell>Created At</Table.HeaderCell>}
              {showColumns.includes('customer') && <Table.HeaderCell>Customer</Table.HeaderCell>}
              {showColumns.includes('review') && <Table.HeaderCell>Review</Table.HeaderCell>}
              {showColumns.includes('images') && <Table.HeaderCell>Images</Table.HeaderCell>}
              {showColumns.includes('response') && <Table.HeaderCell>Response 1</Table.HeaderCell>}
              {showColumns.includes('verified') && <Table.HeaderCell>Verified</Table.HeaderCell>}
              {showColumns.includes('actions') && <Table.HeaderCell>Actions</Table.HeaderCell>}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={showColumns.length} className="text-center py-8">
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : reviews.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={showColumns.length} className="text-center py-8 text-ui-fg-muted">
                  No reviews found
                </Table.Cell>
              </Table.Row>
            ) : (
              reviews.map((review) => (
                <Table.Row key={review.id}>
                  {showColumns.includes('product') && (
                    <Table.Cell>
                      {review.product ? (
                        <div className="flex items-center gap-3">
                          {review.product.thumbnail ? (
                            <img
                              className="h-10 w-10 rounded-md object-cover"
                              src={review.product.thumbnail}
                              alt={review.product.title}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-ui-bg-subtle" />
                          )}
                          <div className="min-w-0 flex-1">
                            <Link to={`/products/${review.product.id}`} className="hover:underline">
                              <p className="text-sm font-medium truncate">
                                {review.product.title}
                              </p>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <span className="text-ui-fg-muted">N/A</span>
                      )}
                    </Table.Cell>
                  )}

                  {showColumns.includes('rating') && (
                    <Table.Cell>
                      <ReviewStars rating={review.rating} />
                    </Table.Cell>
                  )}

                  {showColumns.includes('status') && (
                    <Table.Cell>
                      {getStatusBadge(review)}
                    </Table.Cell>
                  )}

                  {showColumns.includes('created_at') && (
                    <Table.Cell className="text-sm text-ui-fg-subtle">
                      {DateTime.fromISO(review.created_at).toFormat('LLL dd yyyy')}
                    </Table.Cell>
                  )}

                  {showColumns.includes('customer') && (
                    <Table.Cell className="text-sm">
                      {review.name}
                    </Table.Cell>
                  )}

                  {showColumns.includes('review') && (
                    <Table.Cell>
                      <p className="text-sm line-clamp-2 max-w-xs">
                        {review.content}
                      </p>
                    </Table.Cell>
                  )}

                  {showColumns.includes('images') && (
                    <Table.Cell className="text-sm text-ui-fg-subtle">
                      {(review.images || []).length}
                    </Table.Cell>
                  )}

                  {showColumns.includes('response') && (
                    <Table.Cell>
                      {review.response?.content ? (
                        <span className="text-sm text-ui-tag-green-text">Responded</span>
                      ) : (
                        <span className="text-sm text-ui-fg-muted">No response</span>
                      )}
                    </Table.Cell>
                  )}
                  {showColumns.includes('verified') && (
                    <Table.Cell>
                      {getVerifiedBadge(review)}
                    </Table.Cell>
                  )}

                  {showColumns.includes('actions') && (
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => setSelectedReviewForDetails(review)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => setSelectedReview(review)}
                          title="Add response"
                        >
                          <ChatBubble className="h-4 w-4" />
                        </Button>
                      </div>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-ui-fg-subtle">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {/* Page Number Display with Input */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Page</span>
              <Input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputSubmit}
                onBlur={handlePageInputBlur}
                className="w-16 px-2 py-1 text-center text-sm"
              />
              <span className="text-sm">of {totalPages}</span>
            </div>

            <Button
              variant="secondary"
              size="small"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>

          {/* Quick Jump to Page */}
          <div className="flex items-center gap-2">
            {totalPages > 10 && (
              <>
                {currentPage > 3 && (
                  <>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => onPageChange(1)}
                    >
                      1
                    </Button>
                    {currentPage > 4 && <span className="text-ui-fg-muted">...</span>}
                  </>
                )}

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4)) +
                               (currentPage <= 3 ? i : currentPage >= totalPages - 2 ? 4 - (totalPages - currentPage) : 2);
                  if (page > 0 && page <= totalPages && Math.abs(page - currentPage) <= 2) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'primary' : 'transparent'}
                        size="small"
                        onClick={() => onPageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  }
                  return null;
                }).filter(Boolean)}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="text-ui-fg-muted">...</span>}
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => onPageChange(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedReview && (
        <ProductReviewResponseDrawer
          review={selectedReview}
          open={selectedReview !== null}
          setOpen={(open) => setSelectedReview(open ? selectedReview : null)}
        />
      )}

      {selectedReviewForDetails && (
        <ProductReviewDetailsDrawer
          review={selectedReviewForDetails}
          open={selectedReviewForDetails !== null}
          setOpen={(open) => setSelectedReviewForDetails(open ? selectedReviewForDetails : null)}
        />
      )}
    </>
  );
};