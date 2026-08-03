export default function StarRating({ value, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`text-lg leading-none ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${star <= value ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
