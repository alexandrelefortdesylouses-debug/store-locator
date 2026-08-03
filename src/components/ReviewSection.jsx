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
    <div className="border-t border-neutral-200 pt-5 text-left">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Avis clients ({reviews.length})
      </p>

      {reviews.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aucun avis pour cet opticien pour le moment.
        </p>
      ) : (
        <ul className="thin-scrollbar mb-4 flex max-h-60 flex-col gap-3 overflow-y-auto pr-1">
          {reviews.map((review, i) => (
            <li key={i} className="rounded-lg bg-neutral-50 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-neutral-900">
                  {review.author}
                </span>
                <StarRating value={review.rating} readOnly />
              </div>
              <p className="text-neutral-600">{review.comment}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {new Date(review.date).toLocaleDateString("fr-FR")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <p className="text-sm font-medium text-neutral-700">Laisser un avis</p>
        <input
          type="text"
          placeholder="Votre nom"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Note :</span>
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
          className="resize-none rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        <input
          type="password"
          placeholder="Code secret pour publier"
          value={form.secretCode}
          onChange={(e) => setForm({ ...form, secretCode: e.target.value })}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="cursor-pointer self-start rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          Publier l'avis
        </button>
      </form>
    </div>
  );
}
