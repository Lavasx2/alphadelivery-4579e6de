import type { CSSProperties } from "react";

export type PublicStore = {
  translations?: Record<string, Record<string, string>>;
  wilaya?: string | null;
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
  maps_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  opening_hours: Record<string, string> | null;
  rating: number | null;
  rating_count: number | null;
  featured: boolean;
};

export const STORE_PUBLIC_COLUMNS =
  "translations,wilaya,id,slug,name,tagline,description,category,logo_url,banner_url,phone,address,lat,lng,place_id,maps_url,primary_color,secondary_color,opening_hours,rating,rating_count,featured";

export const STORE_CATEGORIES = ["مطاعم", "حلويات", "مخابز", "مقاهي", "بقالة", "صيدليات", "أخرى"];

function readableOn(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#111111";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

/** CSS variable overrides so the whole store page adopts the brand colours. */
export function storeTheme(primary?: string | null, secondary?: string | null): CSSProperties {
  const p = primary && /^#[0-9a-f]{6}$/i.test(primary) ? primary : "#cc2678";
  const s = secondary && /^#[0-9a-f]{6}$/i.test(secondary) ? secondary : null;
  const vars: Record<string, string> = {
    "--primary": p,
    "--primary-foreground": readableOn(p),
    "--ring": p,
  };
  if (s) {
    vars["--accent"] = s;
    vars["--accent-foreground"] = readableOn(s);
  }
  return vars as CSSProperties;
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "store"
  );
}

export function localizeStore<T extends { name: string; tagline?: string | null; description?: string | null; translations?: unknown }>(store: T, lang: string): T {
  const all = store.translations as Record<string, Record<string, string>> | undefined;
  const tr = all?.[lang];
  return { ...store, name: tr?.name || (lang !== "ar" && store.name === "كراست تبسة" ? "Crust Tebessa" : store.name), tagline: tr?.tagline || store.tagline, description: tr?.description || store.description };
}
