import { createServerFn } from "@tanstack/react-start";
import { WILAYA_CENTERS, haversineKm, localFee, interWilayaFee, LOCAL_MAX_FEE } from "./delivery-pricing";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Restaurant coordinates (Crust Tebessa)
const ORIGIN = { latitude: 35.4066917, longitude: 8.1204584 };

/** Farthest deliverable point: Commune of El Hammamet, Tébessa */
export const MAX_DELIVERY_KM = 16;
export const MIN_FEE = 150;
export const MAX_FEE = 350;

/** Algeria-wide: fee keeps rising with distance up to this cap. */
export const ALGERIA_MAX_FEE = 1800;
/** Roughly the farthest road distance inside Algeria. */
export const ALGERIA_MAX_KM = 2000;

export function feeForDistance(km: number, maxKm = MAX_DELIVERY_KM, minFee = MIN_FEE, maxFee = MAX_FEE) {
  const d = Math.max(0, km);
  let raw: number;
  if (d <= maxKm) {
    raw = minFee + (maxFee - minFee) * (d / maxKm);
  } else {
    const ratio = Math.min(1, (d - maxKm) / Math.max(1, ALGERIA_MAX_KM - maxKm));
    raw = maxFee + (ALGERIA_MAX_FEE - maxFee) * ratio;
  }
  return Math.min(ALGERIA_MAX_FEE, Math.round(raw / 10) * 10);
}

export const quoteDelivery = createServerFn({ method: "POST" })
  .inputValidator((input: { lat?: number | null; lng?: number | null; storeId?: string | undefined; wilaya?: string | null }) => {
    const hasCoords = input?.lat != null && input?.lng != null;
    const lat = Number(input?.lat);
    const lng = Number(input?.lng);
    if (hasCoords && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) {
      throw new Error("INVALID_LOCATION");
    }
    const wilaya = typeof input?.wilaya === "string" && WILAYA_CENTERS[input.wilaya] ? input.wilaya : null;
    if (!hasCoords && !wilaya) throw new Error("INVALID_LOCATION");
    const storeId = typeof input?.storeId === "string" ? input.storeId : undefined;
    return { lat: hasCoords ? lat : null, lng: hasCoords ? lng : null, storeId, wilaya };
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];

    let origin = ORIGIN;
    let maxKm = MAX_DELIVERY_KM, minFee = MIN_FEE;
    let storeWilaya: string | null = "Tébessa";
    if (data.storeId) {
      const { getStoreDeliveryConfig } = await import("@/lib/stores-public.functions");
      const cfg = await getStoreDeliveryConfig(data.storeId);
      if (cfg?.lat != null && cfg?.lng != null) origin = { latitude: cfg.lat, longitude: cfg.lng };
      if (cfg) {
        maxKm = Number(cfg.delivery_max_km) || maxKm;
        minFee = Math.min(LOCAL_MAX_FEE, Number(cfg.delivery_fee_min) || minFee);
        storeWilaya = cfg.wilaya ?? null;
      }
    }
    const sameWilaya = !data.wilaya || !storeWilaya || data.wilaya === storeWilaya;

    // Same wilaya needs the exact GPS point
    if (sameWilaya && (data.lat == null || data.lng == null)) {
      return { needsLocation: true as const, sameWilaya, distanceKm: 0, fee: 0, outOfRange: false, mapsUrl: "", address: "", source: "estimate" as const };
    }

    const dest = data.lat != null && data.lng != null
      ? { lat: data.lat, lng: data.lng }
      : { lat: WILAYA_CENTERS[data.wilaya!]![0], lng: WILAYA_CENTERS[data.wilaya!]![1] };
    let km = haversineKm({ lat: origin.latitude, lng: origin.longitude }, dest) * 1.3;
    let source: "routes" | "estimate" = "estimate";
    const hasPoint = data.lat != null && data.lng != null;

    if (hasPoint && lovableKey && mapsKey) {
      try {
        const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": mapsKey,
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
          },
          body: JSON.stringify({
            origin: { location: { latLng: origin } },
            destination: {
              location: { latLng: { latitude: dest.lat, longitude: dest.lng } },
            },
            travelMode: "DRIVE",
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            routes?: { distanceMeters?: number }[];
          };
          const meters = json.routes?.[0]?.distanceMeters;
          if (typeof meters === "number" && meters > 0) {
            km = meters / 1000;
            source = "routes";
          }
        } else {
          console.error(
            `Maps gateway failed [${res.status}]: ${await res.text()}`
          );
        }
      } catch (e) {
        console.error("Maps gateway error", e);
      }
    }

    // Reverse geocode so the customer never has to type the neighbourhood
    let address = "";
    if (hasPoint && lovableKey && mapsKey) {
      try {
        const geo = await fetch(
          `${GATEWAY_URL}/maps/api/geocode/json?latlng=${data.lat},${data.lng}&language=ar`,
          {
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": mapsKey,
            },
          }
        );
        if (geo.ok) {
          const json = (await geo.json()) as {
            results?: { formatted_address?: string }[];
          };
          address = json.results?.[0]?.formatted_address ?? "";
        } else {
          console.error(`Geocode failed [${geo.status}]: ${await geo.text()}`);
        }
      } catch (e) {
        console.error("Geocode error", e);
      }
    }

    const distanceKm = Math.round(km * 10) / 10;
    return {
      needsLocation: false as const,
      sameWilaya,
      distanceKm,
      fee: sameWilaya ? localFee(distanceKm, minFee, maxKm) : interWilayaFee(distanceKm),
      outOfRange: false,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${dest.lat},${dest.lng}`,
      address,
      source,
    };
  });
