import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin
      .from("orders")
      .select("id, status, courier_id, total, created_at, accepted_at, delivered_at, store_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!o) return null;
    let courierName: string | null = null;
    let courierPhone: string | null = null;
    if (o.courier_id) {
      const { data: p } = await supabaseAdmin.from("profiles").select("full_name, phone").eq("id", o.courier_id).maybeSingle();
      courierName = p?.full_name ?? null;
      courierPhone = p?.phone ?? null;
    }
    let storeName: string | null = null;
    if (o.store_id) {
      const { data: s } = await supabaseAdmin.from("stores").select("name").eq("id", o.store_id).maybeSingle();
      storeName = s?.name ?? null;
    }
    return {
      id: o.id,
      status: o.status,
      total: Number(o.total),
      created_at: o.created_at,
      courierName,
      courierPhone,
      storeName,
    };
  });
