import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tr } from "@/lib/tr";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  type ErrorComponentProps,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ShoppingBag } from "lucide-react";
import alphaLogo from "../assets/alpha-logo.jpg.asset.json";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider, useCart } from "../lib/cart";
import { AuthProvider } from "../lib/auth";
import { I18nProvider, useI18n } from "../lib/i18n";
import { AccountMenu, LanguageSwitcher } from "../components/HeaderControls";
import { ThemeToggle } from "../components/ThemeToggle";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {tr("الصفحة غير موجودة")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr("الصفحة التي تبحث عنها غير موجودة أو تم نقلها.")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("العودة للرئيسية")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {tr("حدث خطأ أثناء تحميل الصفحة")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr("يمكنك المحاولة مجدداً أو العودة للصفحة الرئيسية.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("إعادة المحاولة")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tr("الرئيسية")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#1a1a1a" },
        { title: "ألفا ديليفري | Alpha Delivery" },
        {
          name: "description",
          content:
            "ألفا {tr("ديليفري")} — اطلب من كل متاجر مدينتك والدفع عند الاستلام.",
        },
        { property: "og:title", content: "ألفا ديليفري | Alpha Delivery" },
        {
          property: "og:description",
          content:
            "كل المتاجر في تطبيق واحد.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "ألفا" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },

        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700&display=swap",
        },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  }
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const { count } = useCart();
  const { t } = useI18n();
  const linkCls =
    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  const activeCls = "text-primary";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 sm:flex sm:justify-between sm:px-4 sm:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={alphaLogo.url} alt="Alpha Delivery" className="size-9 shrink-0 rounded-lg object-cover" />
          <span className="truncate text-base font-extrabold sm:text-lg">
            {tr("ألفا")} <span className="text-primary">{tr("ديليفري")}</span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link
            to="/"
            className={`hidden sm:inline-flex ${linkCls}`}
            activeProps={{ className: activeCls }}
          >
            {t("home")}
          </Link>
          <Link
            to="/open-store"
            className={`hidden md:inline-flex ${linkCls}`}
            activeProps={{ className: activeCls }}
          >
            {t("openStore")}
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />
          <AccountMenu />
          <Link
            to="/order"
            aria-label={t("myOrder")}
            className="relative ms-1 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:ms-2 sm:px-4"
          >
            <ShoppingBag className="size-5 sm:size-4" />
            <span className="hidden sm:inline">{t("myOrder")}</span>
            {count > 0 && (
              <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-start">
        <Link to="/support" className="order-last rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary">{t("support")}</Link>
        <div className="flex items-center gap-2">
          <img src={alphaLogo.url} alt="" className="size-9 rounded-lg object-cover" />
          <span className="text-lg font-extrabold">
            Alpha <span className="text-primary">Delivery</span>
          </span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">{t("home")}</Link>
          <Link to="/open-store" className="hover:text-primary">{t("openStore")}</Link>
          <Link to="/courier" className="hover:text-primary">{t("courierArea")}</Link>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Alpha Delivery — {t("rights")}
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.status === "pending" });
  
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(25);
      const t1 = setTimeout(() => setProgress(65), 120);
      const t2 = setTimeout(() => setProgress(85), 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setProgress(100);
      const t = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              {visible && (
                <div className="fixed inset-x-0 top-0 z-[100] h-1 bg-background/20">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <Header />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
