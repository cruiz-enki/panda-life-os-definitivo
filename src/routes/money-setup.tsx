/**
 * **Ruta** — Hub de configuración de Finanzas.
 * Centraliza todo lo que se toca "una vez y ya": categorías, tarjetas,
 * cuentas, presupuestos, reglas, recurrentes e importación.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tags, CreditCard, Wallet, Target, Sparkles, Repeat, Download, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/money-setup")({
  head: () => ({
    meta: [
      { title: "Money Setup — ENKI Life OS" },
      { name: "description", content: "Configura categorías, tarjetas, cuentas, presupuestos y reglas" },
    ],
  }),
  component: FinanceSetupPage,
});

type Tile = {
  to: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const tiles: Tile[] = [
  { to: "/categories",    label: "Categorías",       desc: "Crear, editar y organizar categorías de gastos e ingresos", icon: Tags },
  { to: "/finance",       label: "Tarjetas de crédito", desc: "Límites, día de corte y de pago",                          icon: CreditCard },
  { to: "/net-worth",     label: "Cuentas y saldos", desc: "Débito, efectivo, inversión — saldos iniciales",             icon: Wallet },
  { to: "/finance",       label: "Presupuestos",     desc: "Monto máximo por categoría y mes",                            icon: Target },
  { to: "/money-tools",   label: "Reglas y sobres",  desc: "Auto-clasificación y presupuesto tipo sobre",                 icon: Sparkles },
  { to: "/subscriptions", label: "Suscripciones",    desc: "Netflix, dominios, seguros — con alerta antes del cargo",     icon: Repeat },
  { to: "/bank-import",   label: "Importar banco",   desc: "CSV/OFX de BBVA, Nu, Banamex, etc.",                          icon: Download },
];

function FinanceSetupPage() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/finance">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Money Setup</h1>
          <p className="text-sm text-muted-foreground">
            Todo lo que configuras una vez para que el día a día vuele
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.label + t.to} to={t.to as string} className="block">
            <Card className="hover:bg-muted/50 transition-colors h-full">
              <CardContent className="p-4 flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-primary/10">
                  <t.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
