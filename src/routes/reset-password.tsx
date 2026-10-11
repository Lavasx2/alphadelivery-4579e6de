import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "استعادة كلمة المرور | ألفا ديليفري" },
      { name: "description", content: "عيّن كلمة مرور جديدة لحسابك في ألفا ديليفري." },
      { property: "og:title", content: "استعادة كلمة المرور | ألفا ديليفري" },
      { property: "og:description", content: "عيّن كلمة مرور جديدة لحسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg(t("passwordUpdated"));
    setTimeout(() => navigate({ to: "/" }), 1200);
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-black">{t("newPassword")}</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder={t("newPassword")} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
        <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {busy ? t("loading") : t("savePassword")}
        </button>
      </form>
      {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
      {msg && <p className="mt-4 text-sm text-primary">{msg}</p>}
    </div>
  );
}
