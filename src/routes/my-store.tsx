import { createFileRoute, Link } from "@tanstack/react-router";
import { tr } from "@/lib/tr";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { OrdersBoard } from "@/lib/orders-board";
import { StoreMenuEditor, StoreProfileForm, draftToRow, rowToDraft, type StoreDraft } from "@/components/store/StoreEditor";

export const Route = createFileRoute("/my-store")({
  head: () => ({
    meta: [
      { title: "متجري | ألفا ديليفري" },
      { name: "description", content: "لوحة صاحب المتجر: الطلبات الواردة، المنيو، بيانات المتجر والاشتراك السنوي." },
      { property: "og:title", content: "متجري | ألفا ديليفري" },
      { property: "og:description", content: "أدر متجرك وطلباتك على ألفا ديليفري." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyStorePage,
});

type Row = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
  status: string;
  payment_status: string;
  subscription_paid_until: string | null;
};

function MyStorePage() {
  const { session, loading } = useAuth();
  const [store, setStore] = useState<Row | null | undefined>(undefined);
  const [tab, setTab] = useState<"orders" | "menu" | "profile" | "sub">("orders");

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_user_id", session.user.id)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    setStore((data as Row) ?? null);
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || (session && store === undefined)) return <p className="mx-auto max-w-3xl px-4 py-16">...</p>;
  if (!session)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{tr("سجّل الدخول لإدارة متجرك.")}</p>
        <Link to="/auth" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">{tr("تسجيل الدخول")}</Link>
      </div>
    );
  if (!store)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{tr("ليس لديك متجر بعد.")}</p>
        <Link to="/open-store" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">{tr("افتح متجرك")}</Link>
      </div>
    );

  const statusText = store.status === "approved" ? tr("متجرك ظاهر للزبائن") : store.status === "rejected" ? tr("تم رفض/إيقاف المتجر — تواصل مع الإدارة") : tr("متجرك قيد المراجعة من الإدارة");
  const tabs = [
    { id: "orders", label: tr("الطلبات") },
    { id: "menu", label: tr("المنيو") },
    { id: "profile", label: tr("بيانات المتجر") },
    { id: "sub", label: tr("الاشتراك") },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black">{store.name}</h1>
        <Link to="/store/$slug" params={{ slug: store.slug }} className="text-sm font-bold text-primary underline">{tr("صفحة المتجر")}</Link>
      </div>
      <p className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">{statusText}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={`rounded-full px-5 py-2 text-sm font-bold ${tab === x.id ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "orders" && <OrdersBoard mode="store" storeId={store.id} />}
        {tab === "menu" && <StoreMenuEditor storeId={store.id} />}
        {tab === "profile" && <ProfileTab store={store} onSaved={load} />}
        {tab === "sub" && <SubscriptionTab store={store} onSaved={load} />}
      </div>
    </div>
  );
}

function ProfileTab({ store, onSaved }: { store: Row; onSaved: () => Promise<void> }) {
  const [d, setD] = useState<StoreDraft>(() => rowToDraft(store));
  const [msg, setMsg] = useState<string | null>(null);
  async function save() {
    const { error } = await supabase.from("stores").update(draftToRow(d)).eq("id", store.id);
    setMsg(error ? error.message : tr("تم الحفظ"));
    await onSaved();
  }
  return (
    <div>
      <StoreProfileForm value={d} onChange={setD} />
      {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
      <button onClick={() => void save()} className="mt-4 rounded-lg bg-primary px-6 py-2 font-bold text-primary-foreground">{tr("حفظ")}</button>
    </div>
  );
}

function SubscriptionTab({ store, onSaved }: { store: Row; onSaved: () => Promise<void> }) {
  const [s, setS] = useState<{ fee: string; card: string; holder: string }>({ fee: "", card: "", holder: "" });
  const [holder, setHolder] = useState("");
  const [last4, setLast4] = useState("");
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void supabase.from("app_settings").select("key,value").then(({ data }) => {
      const m = new Map((data ?? []).map((r) => [r.key, r.value ?? ""]));
      setS({ fee: m.get("store_fee") ?? "", card: m.get("courier_card_number") ?? "", holder: m.get("courier_card_holder") ?? "" });
    });
  }, []);

  async function submit() {
    if (!holder.trim() || last4.trim().length !== 4) {
      setMsg(tr("أدخل اسم صاحب البطاقة وآخر 4 أرقام"));
      return;
    }
    const { error } = await supabase
      .from("stores")
      .update({ payment_status: "submitted", payment_holder: holder.trim(), payment_last4: last4.trim(), payment_reference: ref.trim() || null, fee_amount: Number(s.fee) || null })
      .eq("id", store.id);
    setMsg(error ? error.message : tr("تم الإرسال، بانتظار تحقق الإدارة"));
    await onSaved();
  }

  const until = store.subscription_paid_until ? new Date(store.subscription_paid_until) : null;
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p>{tr("الاشتراك السنوي")}: <b>{s.fee || "—"} {tr("دج")}</b></p>
        <p className="mt-1">الحالة: <b>{store.payment_status === "paid" ? "مدفوع" : store.payment_status === "submitted" ? "بانتظار التحقق" : "غير مدفوع"}</b>{until && ` — صالح حتى ${until.toLocaleDateString("ar-DZ")}`}</p>
        {s.card && (
          <p className="mt-3">{tr("ادفع عبر البطاقة الذهبية إلى")}: <b dir="ltr">{s.card}</b> ({s.holder})</p>
        )}
      </div>
      {store.payment_status !== "submitted" && (
        <div className="space-y-2">
          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder={tr("اسم صاحب البطاقة")} value={holder} onChange={(e) => setHolder(e.target.value)} />
          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" dir="ltr" maxLength={4} placeholder={tr("آخر 4 أرقام")} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} />
          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder={tr("رقم العملية (اختياري)")} value={ref} onChange={(e) => setRef(e.target.value)} />
          <button onClick={() => void submit()} className="rounded-lg bg-primary px-6 py-2 font-bold text-primary-foreground">{tr("أرسلت الدفع")}</button>
        </div>
      )}
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
