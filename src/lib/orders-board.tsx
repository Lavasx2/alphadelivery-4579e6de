import { useCallback, useEffect, useRef, useState } from "react";
import { tr } from "@/lib/tr";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/menu";
import type { Database } from "@/integrations/supabase/types";

type OrderLine = { name?: string; qty?: number; price?: number };
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  items: unknown;
  total: number;
  status: string;
  created_at: string;
  courier_id: string | null;
  delivered_at: string | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  distance_km: number | null;
  delivery_fee: number | null;
  store_id: string | null;
  stores: { name: string; address: string | null; phone: string | null; maps_url: string | null } | null;
};

const HIDE_DELIVERED_AFTER_MS = 4 * 60 * 1000;
const REFRESH_MS = 12000;

function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (at: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.35);
    };
    play(0, 880);
    play(0.35, 1175);
    play(0.7, 880);
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* audio unavailable */
  }
}

export function OrdersBoard({ mode, storeId }: { mode: "owner" | "courier" | "store"; storeId?: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sound, setSound] = useState(true);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const seenRef = useRef<Set<string> | null>(null);
  const mapsKey = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    let q = supabase
      .from("orders")
      .select("*, stores(name,address,phone,maps_url)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (storeId) q = q.eq("store_id", storeId);
    const { data, error } = await q;
    if (error) setErr(error.message);
    const rows = (data ?? []) as Order[];
    const newIds = rows.filter((o) => o.status === "new").map((o) => o.id);
    if (seenRef.current === null) {
      seenRef.current = new Set(newIds);
    } else {
      const fresh = newIds.filter((id) => !seenRef.current!.has(id));
      seenRef.current = new Set(newIds);
      if (fresh.length > 0 && soundRef.current) beep();
    }
    setOrders(rows);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("orders-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void load()
      )
      .subscribe();
    const poll = setInterval(() => void load(), REFRESH_MS);
    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  async function update(id: string, patch: OrderUpdate) {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) setErr(error.message);
    await load();
  }

  const visible = orders.filter((o) => {
    if (o.status === "cancelled" || o.status === "rejected") return false;
    if (o.status === "delivered") {
      const at = o.delivered_at ? new Date(o.delivered_at).getTime() : 0;
      if (!at || now - at > HIDE_DELIVERED_AFTER_MS) return false;
    }
    if (mode === "courier") {
      return (
        o.status === "new" ||
        Boolean(o.courier_id && user && o.courier_id === user.id)
      );
    }
    return true;
  });

  if (loading) return <p className="mt-6 text-muted-foreground">{t("loading")}</p>;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t("autoRefreshOn")}</span>
        <button
          type="button"
          onClick={() => {
            const next = !sound;
            setSound(next);
            if (next) beep();
          }}
          className="rounded-full border border-border px-3 py-1 text-xs font-bold"
        >
          {sound ? t("soundOn") : t("soundOff")}
        </button>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
      {visible.length === 0 && (
        <p className="text-muted-foreground">{t("noOrders")}</p>
      )}
      {visible.map((o) => {
        const lines = Array.isArray(o.items) ? (o.items as OrderLine[]) : [];
        return (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {o.stores && (
                  <p className="mb-1 text-sm font-black text-primary">
                    🏪 {o.stores.name}
                    {o.stores.address ? ` — ${o.stores.address}` : ""}
                    {o.stores.phone ? ` — ${o.stores.phone}` : ""}
                  </p>
                )}
                <p className="font-bold">
                  {t("customer")}: {o.customer_name} — {o.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("address")}: {o.address}
                </p>
                {o.notes && (
                  <p className="text-sm text-muted-foreground">
                    {t("notes")}: {o.notes}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                {t(o.status)}
              </span>
            </div>

            {(o.lat !== null && o.lng !== null) || o.maps_url ? (
              <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-3">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="size-4 text-primary" />
                  {t("orderLocation")}
                  {o.distance_km !== null && (
                    <span className="font-normal text-muted-foreground">
                      · <bdi dir="ltr">{o.distance_km}</bdi> {t("km")}
                    </span>
                  )}
                </p>
                {mapsKey && o.lat !== null && o.lng !== null && (
                  <iframe
                    title={`${t("orderLocation")} ${o.id}`}
                    loading="lazy"
                    className="mt-2 h-48 w-full rounded-lg border-0"
                    src={`https://www.google.com/maps/embed/v1/view?key=${mapsKey}&center=${o.lat},${o.lng}&zoom=16`}
                  />
                )}
                <a
                  href={
                    o.maps_url ??
                    `https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lng}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-bold text-primary underline"
                >
                  {t("openInMaps")}
                </a>
                {o.delivery_fee !== null && Number(o.delivery_fee) > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("deliveryFee")}: {formatPrice(Number(o.delivery_fee))}
                  </p>
                )}
              </div>
            ) : null}

            <ul className="mt-3 space-y-1 text-sm">
              {lines.map((l, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {l.name} × {l.qty ?? 1}
                  </span>
                  <span>{formatPrice(Number(l.price ?? 0) * Number(l.qty ?? 1))}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-lg font-black text-primary">
                {t("total")}: {formatPrice(Number(o.total))}
              </span>
              <div className="flex gap-2">
                {o.status === "new" && mode !== "store" && (
                  <button
                    onClick={() => {
                      if (!user) return;
                      // التحقق مما إذا كان السائق يمتلك طلباً نشطاً قيد التوصيل حالياً
                      const hasActiveOrder = orders.some(
                        (ord) => ord.courier_id === user.id && ord.status === "delivering"
                      );
                      if (hasActiveOrder) {
                        setErr(tr("عذراً، لديك طلب نشط بالفعل قيد التوصيل. يجب تسليمه أولاً قبل قبول طلب جديد."));
                        return;
                      }
                      setErr(null);
                      void update(o.id, {
                        status: "delivering",
                        courier_id: user.id,
                        accepted_at: new Date().toISOString(),
                      });
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                  >
                    {t("accept")}
                  </button>
                )}
                {o.status === "delivering" && mode !== "store" && (
                  <button
                    onClick={() => void update(o.id, { status: "delivered" })}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                  >
                    {t("markDelivered")}
                  </button>
                )}
                {mode === "courier" && user && o.courier_id === user.id && o.status === "delivering" && (
                  <button
                    onClick={() => {
                      if (!window.confirm(t("courierCancelConfirm"))) return;
                      void update(o.id, { status: "new", courier_id: null, accepted_at: null });
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-muted-foreground"
                  >
                    {t("courierCancel")}
                  </button>
                )}
                {mode === "courier" && user && o.courier_id === user.id && (
                  <button
                    onClick={async () => {
                      const reason = window.prompt(t("reportReason"));
                      if (!reason?.trim()) return;
                      const { error } = await supabase.from("customer_reports").insert({
                        order_id: o.id,
                        courier_id: user.id,
                        reason: reason.trim().slice(0, 300),
                      });
                      if (error) console.error(error);
                      window.alert(error ? t("reportFailed") : t("reportSent"));
                    }}
                    className="rounded-lg border border-destructive px-4 py-2 text-sm font-bold text-destructive"
                  >
                    {t("reportCustomer")}
                  </button>
                )}
                {mode !== "courier" && o.status === "new" && (
                  <button
                    onClick={() => void update(o.id, { status: "cancelled" })}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-muted-foreground"
                  >
                    {t("cancel")}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
