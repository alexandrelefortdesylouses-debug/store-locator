import { useEffect, useState } from "react";
import StarRating from "./StarRating";
import { addReview, getReviews, getSecretCode } from "../utils/storage";

const initialForm = { author: "", rating: 5, comment: "", secretCode: "" };

export default function ReviewSection({ storeId }) {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    setReviews(getReviews(storeId));
    setForm(initialForm);
    setError("");
  }, [storeId]);

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.author.trim() || !form.comment.trim()) {
      setError("Merci de renseigner votre nom et votre commentaire.");
      return;
    }

    if (form.secretCode !== getSecretCode()) {
      setError("Code secret incorrect.");
      return;
    }

    const review = {
      author: form.author.trim(),
      rating: form.rating,
      comment: form.comment.trim(),
      date: new Date().toISOString(),
    };

    setReviews(addReview(storeId, review));
    setForm(initialForm);
    setError("");
  }

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 text-left">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Avis clients ({reviews.length})
      </h3>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucun avis pour ce magasin pour le moment.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 mb-4 max-h-60 overflow-y-auto pr-1">
          {reviews.map((review, i) => (
            <li
              key={i}
              className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {review.author}
                </span>
                <StarRating value={review.rating} readOnly />
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {review.comment}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(review.date).toLocaleDateString("fr-FR")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Laisser un avis
        </p>
        <input
          type="text"
          placeholder="Votre nom"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Note :
          </span>
          <StarRating
            value={form.rating}
            onChange={(rating) => setForm({ ...form, rating })}
          />
        </div>
        <textarea
          placeholder="Votre commentaire"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          rows={3}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-1.5 text-sm resize-none"
        />
        <input
          type="password"
          placeholder="Code secret pour publier"
          value={form.secretCode}
          onChange={(e) => setForm({ ...form, secretCode: e.target.value })}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-1.5 text-sm"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="self-start rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 cursor-pointer"
        >
          Publier l'avis
        </button>
      </form>
    </div>
  );
}
