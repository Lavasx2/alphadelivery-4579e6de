import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const schema = z.object({
  customer_name: z.string().max(100),
  phone: z.string().min(3).max(30),
  address: z.string().max(500),
  notes: z.string().max(1000).nullable(),
  items: z.array(z.object({ id: z.string(), name: z.string(), price: z.number(), qty: z.number().int().min(1).max(99) })).min(1).max(100),
  total: z.number().min(0),
  delivery_fee: z.number().min(0),
  distance_km: z.number().nullable(),
  lat: z.number(),
  lng: z.number(),
  maps_url: z.string().max(500).nullable(),
  store_id: z.string().uuid().nullable(),
  wilaya: z.string().max(60).nullable(),
  device_id: z.string().uuid(),
});

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }
    const ors = [`device_id.eq.${data.device_id}`];
    if (userId) ors.push(`customer_user_id.eq.${userId}`);
    const { data: bans } = await supabaseAdmin.from("customer_bans").select("id").eq("active", true).or(ors.join(",")).limit(1);
    if (bans && bans.length) return { ok: false as const };
    const { device_id, ...row } = data;
    const { data: order, error } = await supabaseAdmin.from("orders").insert({ ...row, customer_user_id: userId }).select("id").single();
    if (error || !order) { console.error(error); return { ok: false as const }; }
    const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await supabaseAdmin.from("order_security").insert({ order_id: order.id, customer_user_id: userId, device_id, client_ip: ip });
    return { ok: true as const };
  });
