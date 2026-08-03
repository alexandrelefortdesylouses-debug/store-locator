import { Fragment } from "react";
import ReviewSection from "./ReviewSection";

export default function StoreCard({ store }) {
  if (!store) return null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {store.name}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {store.address}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-w-sm">
        {Object.entries(store.hours).map(([day, hours]) => (
          <Fragment key={day}>
            <span className="capitalize text-gray-600 dark:text-gray-400">
              {day}
            </span>
            <span className="text-gray-900 dark:text-gray-200 text-right">
              {hours}
            </span>
          </Fragment>
        ))}
      </div>

      <ReviewSection storeId={store.id} />
    </div>
  );
}
