/**
 * **Ruta** — Layout raíz: cabecera HTML, providers globales (QueryClient,
 *
 * Auth, Toaster) y outlet del router.
 */
import { Outlet, createRootRouteWithContext, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { AppSidebar, MobileNav } from "@/components/AppSidebar";
import { QuickCapture } from "@/components/QuickCapture";
import { ModeBackButton } from "@/components/ModeBackButton";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { useGamification } from "@/hooks/use-gamification";
import { GlobalSearchProvider } from "@/components/GlobalSearch";
import { HabitAutoSyncer } from "@/components/HabitAutoSyncer";
import { TitoMascot } from "@/components/TitoMascot";
import { TitoMissions } from "@/components/TitoMissions";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dashboard · Panda's LIFE OS" },
      { name: "description", content: "Tu panel diario: nivel, energía, hábitos y la recomendación inteligente del día." },
      { name: "theme-color", content: "#0a1612" },
      { property: "og:title", content: "Dashboard · Panda's LIFE OS" },
      { property: "og:description", content: "Tu panel diario: nivel, energía, hábitos y la recomendación inteligente del día." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Dashboard · Panda's LIFE OS" },
      { name: "twitter:description", content: "Tu panel diario: nivel, energía, hábitos y la recomendación inteligente del día." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/03c8d7af-f1ff-422e-84f4-a3d813a453cb" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/03c8d7af-f1ff-422e-84f4-a3d813a453cb" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Panda OS" },
      { name: "application-name", content: "Panda OS" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl mb-4">🐼</div>
        <h1 className="font-display text-5xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Esta página se perdió en el bosque de bambú.</p>
        <a href="/" className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow">
          Volver al Dashboard
        </a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Carga no-bloqueante: cargamos como print (no bloquea render) y promovemos a all on load. */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          media="print"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.querySelectorAll('link[rel="stylesheet"][media="print"]');for(var i=0;i<l.length;i++){l[i].media='all';}})();`,
          }}
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          />
        </noscript>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeInitializer />
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthRoute = location.pathname === "/auth";
  const isModeRoute = location.pathname === "/mode";

  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, isAuthRoute, navigate]);

  // Primera entrada tras login: si no hay modo elegido, pedirlo.
  useEffect(() => {
    if (loading || !user || isAuthRoute || isModeRoute) return;
    if (typeof window === "undefined") return;
    const chosen = window.localStorage.getItem("enki:life-mode");
    if (!chosen) navigate({ to: "/mode" });
  }, [user, loading, isAuthRoute, isModeRoute, navigate]);

  // Service Worker: OneSignal maneja push con /OneSignalSDKWorker.js (scope "/").
  // Para que Chrome/Edge/Android muestre "Instalar app" (beforeinstallprompt)
  // se necesita un SW activo. Si OneSignal ya está registrado, liberamos /sw.js.
  // Si NO hay ningún SW, registramos /sw.js para habilitar instalación PWA.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((regs) => {
      const hasOneSignal = regs.some((r) => {
        const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
        return url.includes("OneSignalSDKWorker");
      });
      const ownSw = regs.find((r) => {
        const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
        return url.endsWith("/sw.js");
      });
      if (hasOneSignal && ownSw) {
        ownSw.unregister().then(() => console.log("[SW] /sw.js liberado para OneSignal"));
        return;
      }
      if (!hasOneSignal && !ownSw) {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then(() => console.log("[SW] /sw.js registrado (instalabilidad PWA)"))
          .catch((err) => console.warn("[SW] Registro falló", err));
      }
    });
  }, []);

  if (isAuthRoute) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="text-4xl animate-pulse">🐼</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="text-4xl animate-pulse">🐼</div>
      </div>
    );
  }

  return (
    <GlobalSearchProvider>
      <div className="flex min-h-dvh">
        <AppSidebar />
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <ModeBackButton />
          <Outlet />
        </main>
        <QuickCapture />
        <MobileNav />
        
        <DeferredGamification />
        <HabitAutoSyncer />
        <TitoMascot />
        <Toaster />
      </div>
    </GlobalSearchProvider>
  );
}

// Difiere el motor de gamificación: monta sus hooks (finance/health/home) sólo
// cuando el navegador está idle, para no bloquear el primer render de cada ruta.
function DeferredGamification() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!ready) return null;
  return <GamificationRunner />;
}

function GamificationRunner() {
  useGamification();
  useEffect(() => {
    void import("@/lib/onesignal-client").then((m) => m.initOneSignal());
  }, []);
  return null;
}

function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);
  return null;
}
