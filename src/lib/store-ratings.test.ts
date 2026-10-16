import { describe, expect, it } from "vitest";
import { googleRating, placeIdFromMapsUrl } from "./store-ratings";

describe("actual Google ratings", () => {
  it("hides a place without a Google rating", () => {
    expect(googleRating(undefined, undefined)).toEqual({ rating: null, rating_count: 0 });
  });
  it("rejects the old default 4.9 without reviews", () => {
    expect(googleRating(4.9, 0)).toEqual({ rating: null, rating_count: 0 });
  });
  it("preserves an actual five-star rating", () => {
    expect(googleRating(5, 12)).toEqual({ rating: 5, rating_count: 12 });
  });
  it("preserves other actual ratings unchanged", () => {
    expect(googleRating(3.7, 9)).toEqual({ rating: 3.7, rating_count: 9 });
  });
  it("reads an explicit Google place ID", () => {
    expect(placeIdFromMapsUrl("https://www.google.com/maps/search/?api=1&query_place_id=ChIJ1234567890")).toBe("ChIJ1234567890");
  });
});