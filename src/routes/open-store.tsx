import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { tr } from "@/lib/tr";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { slugify } from "@/lib/stores";
import { StoreProfileForm, draftToRow, emptyDraft, type StoreDraft } from "@/components/store/StoreEditor";
import { refreshStoreRating } from "@/lib/store-rating.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/open-store")({
  head: () => ({
    meta: [
      { title: "افتح متجرك | ألفا ديليفري" },
      { name: "description", content: "سجّل متجرك في ألفا ديليفري: بياناتك، ألوانك، صورك ومنيو كامل، ثم انطلق بعد الموافقة." },
      { property: "og:title", content: "افتح متجرك | ألفا ديليفري" },
      { property: "og:description", content: "انضم إلى منصة ألفا ديليفري ووصّل طلباتك عبر شبكة موصلين موحدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OpenStorePage,
});

function OpenStorePage() {
  const { session, loading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const refreshRating = useServerFn(refreshStoreRating);
  const [draft, setDraft] = useState<StoreDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-16">...</p>;
  if (!session)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-black">{tr("افتح متجرك على ألفا ديليفري")}</h1>
        <p className="mt-3 text-muted-foreground">{tr("سجّل الدخول أولاً لبدء تسجيل متجرك.")}</p>
        <Link to="/auth" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
          {tr("تسجيل الدخول")}
        </Link>
      </div>
    );

  async function submit() {
    if (!session) return;
    if (!draft.name.trim() || !draft.phone.trim() || !draft.address.trim()) {
      setErr(tr("الاسم والهاتف والعنوان مطلوبة"));
      return;
    }
    setBusy(true);
    setErr(null);
    const slug = `${slugify(draft.name) || "store"}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: created, error } = await supabase
      .from("stores")
      .insert({ ...draftToRow(draft), slug, status: "pending", owner_user_id: session.user.id })
      .select("id").single();
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    if (created) await refreshRating({ data: { storeId: created.id } }).catch(() => undefined);
    await supabase.rpc("claim_store_owner_role");
    await refreshRoles();
    navigate({ to: "/my-store" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-black">{tr("افتح متجرك")}</h1>
      <p className="mt-2 text-muted-foreground">
        {tr("املأ بيانات متجرك واختر ألوانك. بعد الإرسال ستضيف المنيو من صفحة «متجري»، ويظهر متجرك للزبائن بعد موافقة الإدارة.")}
      </p>
      <div className="mt-8">
        <StoreProfileForm value={draft} onChange={setDraft} />
      </div>
      {err && <p className="mt-4 text-sm text-red-500">{err}</p>}
      <button
        disabled={busy}
        onClick={() => void submit()}
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-50"
      >
        {busy ? tr("جارٍ الإرسال...") : tr("إرسال للمراجعة")}
      </button>
    </div>
  );
}
