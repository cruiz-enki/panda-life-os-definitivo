/**
 * Componente que muestra un botón/tarjeta para instalar la app como PWA.
 * - Android/Chrome/Edge: captura `beforeinstallprompt` y ofrece instalar en 1 tap.
 * - iOS Safari: no expone API; muestra instrucciones "Compartir → Añadir a pantalla de inicio".
 * - Si ya está instalada (`display-mode: standalone`), no muestra nada.
 */
import { useEffect, useState } from "react";
import { Download, Share, Plus, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPWA({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("¡App instalada! Ábrela desde tu pantalla de inicio.");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("Instalando…");
      }
      setDeferred(null);
      return;
    }
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    toast.info("Tu navegador no ofrece instalación automática. Usa el menú del navegador → 'Instalar app'.");
  };

  if (compact) {
    if (!deferred && !isIOS) return null;
    return (
      <Button onClick={handleInstall} size="sm" variant="outline">
        <Download className="w-4 h-4 mr-2" /> Instalar app
      </Button>
    );
  }

  return (
    <Card className="p-5 border-l-4 border-primary bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <Smartphone className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold mb-1">Instala Panda OS en tu dispositivo</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Instálala como app: se abre en pantalla completa, recibe push notifications y arranca desde tu home screen.
          </p>

          {!showIOSHelp && (
            <Button onClick={handleInstall}>
              <Download className="w-4 h-4 mr-2" />
              {isIOS ? "Cómo instalar en iOS" : "Instalar app"}
            </Button>
          )}

          {showIOSHelp && (
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span>Toca <Share className="w-4 h-4 inline mx-1" /> <b>Compartir</b> en la barra inferior de Safari.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <span>Elige <Plus className="w-4 h-4 inline mx-1" /> <b>Añadir a pantalla de inicio</b>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <span>Confirma con <b>Añadir</b>. Verás el ícono de Panda en tu home.</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                ⚠️ En iOS las push notifications solo funcionan si abres la app desde el ícono instalado (no desde Safari).
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
