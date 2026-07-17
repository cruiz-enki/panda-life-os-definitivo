/**
 * **Ruta** — /locations · Check-ins de ubicación con minimapa de vida.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, Locate, Loader2, Trash2, Plus, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LOCATION_CATEGORIES, categoryMeta, useLocations, type LocationCheckin } from "@/hooks/use-locations";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/locations")({
  component: LocationsPage,
  head: () => ({
    meta: [
      { title: "Ubicaciones · LIFE OS" },
      { name: "description", content: "Tus check-ins de lugares visitados y minimapa de vida." },
    ],
  }),
});

const BROWSER_KEY = (import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string) ?? "";
const TRACKING_ID = (import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string) ?? "";

let mapsPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (mapsPromise) return mapsPromise;
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).google?.maps) return Promise.resolve();
  if (!BROWSER_KEY) return Promise.reject(new Error("Falta VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"));

  mapsPromise = new Promise((resolve, reject) => {
    (window as any).__initLifeMap = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      libraries: "places",
      callback: "__initLifeMap",
      v: "weekly",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Error cargando Google Maps"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

function LocationsPage() {
  const { checkins, isLoading, add, remove, uniqueCities, totalsByCategory } = useLocations();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="w-7 h-7 text-primary" /> Ubicaciones
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Tus lugares visitados y el minimapa de tu vida.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? "outline" : "default"}>
          {showForm ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nuevo check-in</>}
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBox label="Check-ins" value={checkins.length} />
        <StatBox label="Ciudades" value={uniqueCities} />
        {LOCATION_CATEGORIES.map((c) => (
          <StatBox key={c.key} label={c.label} value={totalsByCategory[c.key] ?? 0} emoji={c.emoji} />
        ))}
      </div>

      {showForm && <CheckinForm onSaved={() => setShowForm(false)} onCancel={() => setShowForm(false)} onAdd={add} />}

      <Card className="border-primary/10 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapIcon className="w-4 h-4 text-primary" /> Minimapa de vida
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LifeMap checkins={checkins} />
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-base">Historial ({checkins.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>
          ) : checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aún no hay check-ins. Crea el primero.</p>
          ) : (
            checkins.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 transition-colors">
                <div className="text-2xl">{categoryMeta(c.category).emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {format(new Date(c.visited_at), "d MMM yyyy", { locale: es })}
                    {c.address ? ` · ${c.address}` : ""}
                  </div>
                  {c.note && <div className="text-xs text-foreground/70 mt-1 line-clamp-2">{c.note}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)} aria-label="Eliminar">
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, emoji }: { label: string; value: number; emoji?: string }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
      <div className="text-2xl font-display font-bold">{emoji ? <span className="mr-1">{emoji}</span> : null}{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function CheckinForm({
  onAdd,
  onSaved,
  onCancel,
}: {
  onAdd: (input: Omit<LocationCheckin, "id" | "user_id" | "created_at">) => Promise<string | undefined>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("ciudad");
  const [visitedAt, setVisitedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [gpsBusy, setGpsBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const useGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        setLat(la);
        setLng(ln);
        // Reverse geocode via Google gateway (opcional, best-effort)
        try {
          await loadGoogleMaps();
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: { lat: la, lng: ln } }, (results: any[], status: string) => {
            if (status === "OK" && results?.[0]) {
              const r = results[0];
              setAddress(r.formatted_address ?? "");
              if (!name) setName(r.formatted_address?.split(",")[0] ?? "Ubicación actual");
            }
          });
        } catch {
          // silencio: aunque falle reverse geocode, tenemos lat/lng
        }
        toast.success(`Ubicación capturada (${la.toFixed(4)}, ${ln.toFixed(4)})`);
        setGpsBusy(false);
      },
      (err) => {
        setGpsBusy(false);
        toast.error(`No se pudo obtener ubicación: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Ponle nombre al lugar");
      return;
    }
    setSaving(true);
    const err = await onAdd({
      name: name.trim(),
      category,
      latitude: lat,
      longitude: lng,
      address: address || null,
      place_id: null,
      visited_at: visitedAt,
      note: note.trim() || null,
      rating: null,
    });
    setSaving(false);
    if (err) {
      toast.error(`Error: ${err}`);
    } else {
      toast.success("Check-in guardado");
      onSaved();
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Nuevo check-in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre del lugar</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: CDMX · Contramar" />
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Categoría</Label>
          <div className="flex flex-wrap gap-2">
            {LOCATION_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  category === c.key
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mr-1">{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ubicación</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={useGPS} disabled={gpsBusy}>
              {gpsBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Locate className="w-4 h-4 mr-2" />}
              Usar mi ubicación
            </Button>
            {lat !== null && lng !== null && (
              <span className="text-xs text-muted-foreground">
                {lat.toFixed(5)}, {lng.toFixed(5)}
                {address ? ` · ${address}` : ""}
              </span>
            )}
          </div>
          <Input
            placeholder="O escribe dirección / coords manualmente"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Nota (opcional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Con quién fuiste, qué pasó, por qué importa…" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LifeMap({ checkins }: { checkins: LocationCheckin[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const g = (window as any).google;
    if (!mapRef.current) {
      mapRef.current = new g.maps.Map(ref.current, {
        center: { lat: 19.4326, lng: -99.1332 },
        zoom: 3,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
          { featureType: "water", stylers: [{ color: "#1e293b" }] },
          { featureType: "road", stylers: [{ color: "#334155" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });
    }

    const map = mapRef.current;
    const geo = checkins.filter((c) => c.latitude !== null && c.longitude !== null);
    // clear old markers
    if ((map as any).__markers) (map as any).__markers.forEach((m: any) => m.setMap(null));
    const markers = geo.map((c) => {
      const meta = categoryMeta(c.category);
      return new g.maps.Marker({
        position: { lat: c.latitude!, lng: c.longitude! },
        map,
        title: `${meta.emoji} ${c.name}`,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: meta.color,
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 1.5,
        },
      });
    });
    (map as any).__markers = markers;

    if (geo.length > 0) {
      const bounds = new g.maps.LatLngBounds();
      geo.forEach((c) => bounds.extend({ lat: c.latitude!, lng: c.longitude! }));
      map.fitBounds(bounds, 60);
      if (geo.length === 1) map.setZoom(10);
    }
  }, [ready, checkins]);

  if (error) {
    return (
      <div className="h-[420px] flex items-center justify-center bg-muted/20 text-center p-6">
        <div className="max-w-md text-sm text-muted-foreground">
          <MapIcon className="w-8 h-8 mx-auto mb-2 opacity-60" />
          <p className="font-medium text-foreground mb-1">No se pudo cargar el mapa</p>
          <p>{error}</p>
          <p className="mt-2 text-xs">
            La clave gestionada de Google Maps solo funciona en <code>*.lovable.app</code>. Para tu dominio <code>os.cmrs.mx</code> necesitas conectar tu propia API key de Google Maps con ese dominio en las restricciones de referrer.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="w-full h-[420px]" />;
}
