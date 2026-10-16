/** Missing or unrated Google places never receive an invented rating. */
export function googleRating(rating: unknown, count: unknown) {
  if (typeof rating !== "number" || !Number.isFinite(rating) || rating < 1 || rating > 5 ||
      typeof count !== "number" || !Number.isInteger(count) || count <= 0) {
    return { rating: null, rating_count: 0 };
  }
  return { rating, rating_count: count };
}

export function placeIdFromMapsUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const id = url.searchParams.get("query_place_id") || url.searchParams.get("place_id") ||
      url.searchParams.get("q")?.match(/^place_id:(.+)$/)?.[1] ||
      decodeURIComponent(url.pathname).match(/!1s(ChI[^!/?]+)/)?.[1];
    return id && /^[a-zA-Z0-9_-]{10,250}$/.test(id) ? id : null;
  } catch { return null; }
}