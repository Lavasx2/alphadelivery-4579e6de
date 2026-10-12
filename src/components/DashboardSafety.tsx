import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/menu";

type Report = {
  id: string;
  order_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  order?: { customer_name: string; phone: string; customer_user_id: string | null } | null;
  security?: { device_id: string; client_ip: string | null; customer_user_id: string | null } | null;
  ban?: { id: string; active: boolean } | null;
};

export function ReportsManager() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: reps } = await supabase.from("customer_reports").select("*").order("created_at", { ascending: false });
    const list = (reps ?? []) as Report[];
    const ids = list.map((r) => r.order_id);
    const repIds = list.map((r) => r.id);
    if (ids.length) {
      const [{ data: ords }, { data: sec }, { data: bans }] = await Promise.all([
        supabase.from("orders").select("id, customer_name, phone, customer_user_id").in("id", ids),
        supabase.from("order_security").select("order_id, device_id, client_ip, customer_user_id").in("order_id", ids),
        supabase.from("customer_bans").select("id, report_id, active").in("report_id", repIds),
      ]);
      for (const r of list) {
        r.order = ords?.find((o) => o.id === r.order_id) ?? null;
        r.security = sec?.find((s) => s.order_id === r.order_id) ?? null;
        r.ban = bans?.find((b) => b.report_id === r.id) ?? null;
      }
    }
    setRows(list);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleBan(r: Report) {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (r.ban) {
      await supabase.from("customer_bans").update({ active: !r.ban.active, updated_at: new Date().toISOString() }).eq("id", r.ban.id);
    } else {
      const device = r.security?.device_id ?? null;
      const user = r.security?.customer_user_id ?? r.order?.customer_user_id ?? null;
      if (!device && !user) { window.alert(t("banNoIdentity")); setBusy(false); return; }
      await supabase.from("customer_bans").insert({ report_id: r.id, device_id: device, customer_user_id: user, created_by: u.user!.id });
    }
    setBusy(false);
    void load();
  }

  if (!rows.length) return <p className="mt-8 text-muted-foreground">{t("noReports")}</p>;
  return (
    <div className="mt-8 space-y-3">
      {rows.map((r) => {
        const banned = r.ban?.active;
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{r.order?.customer_name || "—"} · <span dir="ltr">{r.order?.phone}</span></p>
                <p className="mt-1 text-sm"><b>{t("reason")}:</b> {r.reason}</p>
                {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} · IP: <span dir="ltr">{r.security?.client_ip ?? "—"}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {banned && <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">{t("banned")}</span>}
                <button disabled={busy} onClick={() => toggleBan(r)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${banned ? "border border-border bg-background" : "bg-destructive text-destructive-foreground"}`}>
                  {banned ? t("unban") : t("banCustomer")}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type OrderRow = { store_id: string | null; wilaya: string | null; total: number; items: unknown; status: string };

export function StatsManager() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stores, setStores] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const [{ data: o }, { data: s }] = await Promise.all([
        supabase.from("orders").select("store_id, wilaya, total, items, status").neq("status", "cancelled").limit(5000),
        supabase.from("stores").select("id, name, wilaya"),
      ]);
      setOrders((o ?? []) as OrderRow[]);
      setStores(Object.fromEntries((s ?? []).map((x) => [x.id, x.name])));
    })();
  }, []);

  const { byWilaya, products } = useMemo(() => {
    const sw = new Map<string, Map<string, { n: number; rev: number }>>();
    const pr = new Map<string, { name: string; wilaya: string; qty: number; rev: number }>();
    for (const o of orders) {
      const w = o.wilaya || "—";
      const sid = o.store_id ?? "none";
      if (!sw.has(w)) sw.set(w, new Map());
      const m = sw.get(w)!;
      const cur = m.get(sid) ?? { n: 0, rev: 0 };
      cur.n += 1; cur.rev += Number(o.total) || 0;
      m.set(sid, cur);
      const items = Array.isArray(o.items) ? (o.items as { name?: string; qty?: number; price?: number }[]) : [];
      for (const it of items) {
        const key = `${w}|${it.name}`;
        const p = pr.get(key) ?? { name: it.name ?? "?", wilaya: w, qty: 0, rev: 0 };
        p.qty += Number(it.qty) || 1; p.rev += (Number(it.price) || 0) * (Number(it.qty) || 1);
        pr.set(key, p);
      }
    }
    const byWilaya = [...sw.entries()].map(([w, m]) => {
      const [sid, v] = [...m.entries()].sort((a, b) => b[1].rev - a[1].rev)[0];
      return { wilaya: w, store: stores[sid] ?? "—", ...v };
    }).sort((a, b) => b.rev - a.rev);
    const products = [...pr.values()].sort((a, b) => b.qty - a.qty).slice(0, 30);
    return { byWilaya, products };
  }, [orders, stores]);

  const th = "p-2 text-start text-xs font-bold text-muted-foreground";
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-black">{t("topStoresByWilaya")}</h2>
        {!byWilaya.length ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : (
          <table className="w-full text-sm"><thead><tr><th className={th}>{t("wilaya")}</th><th className={th}>{t("store")}</th><th className={th}>{t("ordersCount")}</th><th className={th}>{t("revenue")}</th></tr></thead>
            <tbody>{byWilaya.map((r) => <tr key={r.wilaya} className="border-t border-border"><td className="p-2">{r.wilaya}</td><td className="p-2 font-bold">{r.store}</td><td className="p-2">{r.n}</td><td className="p-2">{formatPrice(r.rev)}</td></tr>)}</tbody></table>
        )}
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-black">{t("topProductsByWilaya")}</h2>
        {!products.length ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : (
          <table className="w-full text-sm"><thead><tr><th className={th}>{t("product")}</th><th className={th}>{t("wilaya")}</th><th className={th}>{t("quantity")}</th><th className={th}>{t("revenue")}</th></tr></thead>
            <tbody>{products.map((p) => <tr key={p.wilaya + p.name} className="border-t border-border"><td className="p-2 font-bold">{p.name}</td><td className="p-2">{p.wilaya}</td><td className="p-2">{p.qty}</td><td className="p-2">{formatPrice(p.rev)}</td></tr>)}</tbody></table>
        )}
      </section>
    </div>
  );
}
