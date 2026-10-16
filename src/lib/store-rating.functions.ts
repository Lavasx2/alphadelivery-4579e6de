import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { googleRating, placeIdFromMapsUrl } from "@/lib/store-ratings";

/** One authenticated lookup per profile save; never guess a business by its name. */
export const refreshStoreRating = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { storeId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.storeId)) throw new Error("INVALID_STORE");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase.from("stores")
      .select("id,owner_user_id,place_id,maps_url")
      .eq("id", data.storeId).maybeSingle();
    if (error || !store || store.owner_user_id !== context.userId) throw new Error("STORE_ACCESS_DENIED");
    // Prefer the current submitted link over an old saved place ID.
    const placeId = placeIdFromMapsUrl(store.maps_url) || (!store.maps_url ? store.place_id : null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const clear = async () => {
      const { error: saveError } = await supabaseAdmin.from("stores")
        .update({ rating: null, rating_count: 0 }).eq("id", store.id);
      if (saveError) throw new Error(saveError.message);
    };
    if (!placeId) {
      await clear();
      return { ok: true, rated: false };
    }
    const key = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!key || !mapsKey) {
      await clear();
      return { ok: false, rated: false, reason: "Google Maps connection unavailable" };
    }
    try {
      const response = await fetch(`https://connector-gateway.lovable.dev/google_maps/places/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-Connection-Api-Key": mapsKey,
          "X-Goog-FieldMask": "id,rating,userRatingCount",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error(`Google store rating failed [${response.status}]: ${body}`);
        await clear();
        const reason = response.status === 403
          ? "Google Maps denied rating access. Check the server key restrictions and Places API access."
          : "Google rating unavailable";
        return { ok: false, rated: false, reason };
      }
      const result = await response.json() as { rating?: number; userRatingCount?: number };
      const rating = googleRating(result.rating, result.userRatingCount);
      const { error: saveError } = await supabaseAdmin.from("stores")
        .update({ ...rating, place_id: placeId }).eq("id", store.id);
      if (saveError) throw new Error(saveError.message);
      return { ok: true, rated: rating.rating !== null };
    } catch (error) {
      console.error("Google store rating unavailable", error);
      await clear();
      return { ok: false, rated: false, reason: "Google rating unavailable" };
    }
  });