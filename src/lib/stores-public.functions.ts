import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { MenuItem } from "@/lib/menu";
import { STORE_PUBLIC_COLUMNS, type PublicStore } from "@/lib/stores";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Approved stores for the Alpha Delivery directory. */
export const listStores = createServerFn({ method: "GET" }).handler(async (): Promise<PublicStore[]> => {
  const { data, error } = await publicClient()
    .from("stores")
    .select(STORE_PUBLIC_COLUMNS)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicStore[];
});

export const getStoreBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d?.slug ?? "").slice(0, 80) }))
  .handler(async ({ data }): Promise<{ store: PublicStore; items: MenuItem[] } | null> => {
    const sb = publicClient();
    const { data: store, error } = await sb
      .from("stores")
      .select(STORE_PUBLIC_COLUMNS)
      .eq("slug", data.slug)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!store) return null;
    const s = store as unknown as PublicStore;
    const { data: rows } = await sb
      .from("menu_items")
      .select("id,name,description,price,category,image_url,popular")
      .eq("store_id", s.id)
      .eq("available", true)
      .order("sort_order", { ascending: true });
    const items: MenuItem[] = (rows ?? []).map((r) => {
      const item: MenuItem = {
        id: r.id,
        name: r.name,
        description: r.description ?? "",
        price: Number(r.price),
        category: r.category,
        popular: r.popular,
      };
      if (r.image_url) item.image = r.image_url;
      return item;
    });
    return { store: s, items };
  });

/** Store coordinates + delivery fee config, used for the delivery quote. */
export async function getStoreDeliveryConfig(storeId: string) {
  const { data } = await publicClient()
    .from("stores")
    .select("lat,lng,delivery_max_km,delivery_fee_min,delivery_fee_max")
    .eq("id", storeId)
    .eq("status", "approved")
    .maybeSingle();
  return data;
}
