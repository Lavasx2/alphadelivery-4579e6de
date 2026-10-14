import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "الدعم | ألفا ديليفري" },
      { name: "description", content: "تواصل مع دعم ألفا ديليفري: اكتب بريدك وشكواك وسنرد عليك عبر البريد." },
      { property: "og:title", content: "الدعم | ألفا ديليفري" },
      { property: "og:description", content: "أرسل شكواك لفريق ألفا ديليفري وسنرد عليك بالبريد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || message.trim().length < 5) return setState("err");
    setState("busy");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("support_tickets").insert({
      email: email.trim().slice(0, 200),
      message: message.trim().slice(0, 3000),
      user_id: u.user?.id ?? null,
    });
    setState(error ? "err" : "ok");
    if (!error) { setEmail(""); setMessage(""); }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="flex items-center gap-3 text-2xl font-black sm:text-3xl">
        <LifeBuoy className="size-7 text-primary" /> {t("supportTitle")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("supportIntro")}</p>
      <form onSubmit={send} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("email")} *</label>
          <input type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("complaint")} *</label>
          <textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring" />
        </div>
        {state === "ok" && <p className="rounded-lg bg-primary/10 p-3 text-sm font-bold text-primary">{t("supportSent")}</p>}
        {state === "err" && <p className="rounded-lg bg-destructive/15 p-3 text-sm font-bold text-destructive">{t("supportFailed")}</p>}
        <button disabled={state === "busy"} className="min-h-12 w-full rounded-xl bg-primary text-lg font-black text-primary-foreground disabled:opacity-50">
          {t("send")}
        </button>
      </form>
    </div>
  );
}
