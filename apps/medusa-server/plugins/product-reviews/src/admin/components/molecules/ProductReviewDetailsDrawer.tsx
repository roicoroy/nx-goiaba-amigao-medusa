import { Button, Drawer, Text } from '@medusajs/ui';
import { DateTime } from 'luxon';
import ReactPlayer from "react-player";
import { Link } from 'react-router-dom';
import type { AdminProductReview } from '../../../sdk/types';
import { ReviewStars } from '../atoms/review-stars';
import { SectionRow } from '../atoms/section-row';

export const ProductReviewDetailsDrawer = ({
  review,
  open,
  setOpen,
}: {
  review: AdminProductReview | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  if (!review) return null;

  const ProductValue = () => (
    <div className="flex items-center gap-4">
      {review.product && (
        <>
          {review.product.thumbnail ? (
        <img
          className="h-12 w-12 flex-shrink-0 rounded-md"
          src={review.product.thumbnail}
          alt={review.product.title}
        />
      ) : (
        <div className="h-12 w-12 flex-shrink-0 rounded-md bg-ui-bg-subtle" />
      )}
      <Link to={`/products/${review.product.id}`}>
        <Text className="hover:underline">{review.product.title}</Text>
      </Link>
        </>
      )}
    </div>
  );

  const OrderValue = () => {
    if (!review.order) {
      return <Text className="text-ui-fg-subtle text-sm">No order</Text>;
    }
    
    return (
      <Link to={`/orders/${review.order.id}`}>
        <Text className="hover:underline">#{review.order.display_id}</Text>
      </Link>
    );
  };

  const StatusValue = () => (
    <Text className="text-ui-fg-subtle text-sm">{review.status}</Text>
  );

  const CreatedAtValue = () => (
    <Text className="text-ui-fg-subtle text-sm">
      {DateTime.fromISO(review.created_at).toFormat('LLL dd yyyy hh:mm a')}
    </Text>
  );

  const CustomerValue = () => (
    <div className="flex flex-col gap-1">
      <Text>{review.name}</Text>
    </div>
  );

  const ReviewContent = () => (
    <div className="flex flex-col gap-2">
      <Text className="whitespace-pre-wrap">{review.content}</Text>
    </div>
  );

  const ImagesValue = () => (
    <div className="grid grid-cols-3 gap-2 w-full">
      {review.images && review.images.map((media, index) => (
        <div
        key={media.id}
        className="relative flex h-40 items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4 focus:ring-papapogreen-light-1"
      >

        <>
          <span className="absolute inset-0 overflow-hidden rounded-md">
            {media.type.startsWith('image') && (<img
              src={media.url}
              alt=""
              className="h-full w-full object-cover object-center"
              sizes="(max-width: 768px) 25vw, (max-width: 1200px) 15w, 15vw"
            />)}
            {media.type.startsWith('video') && (<ReactPlayer
              src={media.url}
              controls={true}
              width={'100%'}
              height={'100%'}

            />)}
          </span>
        </>
      </div>
      ))}
    </div>
  );

  const ResponseValue = () => (
    <div className="flex flex-col gap-1">
      <Text className="whitespace-pre-wrap">{review.response?.content}</Text>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title className="font-medium">Review Details</Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="flex flex-col divide-y">
          <SectionRow title="Customer" value={<CustomerValue />} />
          <SectionRow title="Status" value={<StatusValue />} />
          <SectionRow title="Created At" value={<CreatedAtValue />} />
          <SectionRow title="Product" value={<ProductValue />} />
          <SectionRow title="Order" value={<OrderValue />} />
          <SectionRow
            title="Rating"
            value={<ReviewStars rating={review.rating} />}
          />
          <SectionRow title="Review" value={<ReviewContent />} />
          {review.images.length > 0 && (
            <SectionRow title="Images" value={<ImagesValue />} />
          )}

          <SectionRow
            title="Response"
            value={
              review.response ? <ResponseValue /> : <Text>No response</Text>
            }
          />
          {!!review.response?.created_at && (
            <SectionRow
              title="Responded At"
              value={
                <Text>
                  {DateTime.fromISO(review.response.created_at).toFormat(
                    'LLL dd yyyy hh:mm a'
                  )}
                </Text>
              }
            />
          )}
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Close</Button>
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};
