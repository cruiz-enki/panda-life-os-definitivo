/**
 * **Componente** — Inventario de objetos mágicos del usuario con acciones de activar.
 */
import { useState } from "react";
import { useInventory, type MagicItem, type InventoryItem } from "@/hooks/use-inventory";
import { useAppState } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingBag, Box, Gift, Clock, Zap } from "lucide-react";

export function MagicInventory() {
  const { items, inventory, loading, buyItem, activateItem } = useInventory();
  const { state } = useAppState();

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Consultando el cofre de tesoros...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" /> Inventario Mágico
          </h2>
          <p className="text-sm text-muted-foreground">Objetos que potencian tu camino.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 bg-purple-500/10 text-purple-600 border-purple-200">
          {state.xp} XP Disponibles
        </Badge>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shop" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Tienda
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Box className="w-4 h-4" /> Mis Objetos ({inventory.reduce((acc, i) => acc + i.quantity, 0)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:border-purple-300 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <span className="text-4xl">{item.emoji}</span>
                    <Badge variant="outline" className={getRarityColor(item.rarity)}>
                      {item.rarity.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{item.name}</CardTitle>
                  <CardDescription className="text-xs">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-bold text-purple-600">{item.cost_xp} XP</span>
                    <Button 
                      size="sm" 
                      onClick={() => buyItem(item)}
                      disabled={state.xp < item.cost_xp}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          {inventory.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-xl border-muted">
              <Gift className="w-12 h-12 mx-auto text-muted mb-4 opacity-20" />
              <p className="text-muted-foreground">Tu mochila está vacía. Visita la tienda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map((inv) => (
                <Card key={inv.id} className={`overflow-hidden ${inv.is_active ? 'border-green-500 bg-green-500/5' : ''}`}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="text-4xl shrink-0">{inv.item.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-bold text-sm truncate">{inv.item.name}</h3>
                        <Badge variant="secondary">x{inv.quantity}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{inv.item.description}</p>
                      
                      <div className="mt-3 flex items-center justify-between">
                        {inv.is_active ? (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                            <Clock className="w-3 h-3 animate-spin-slow" /> Activo hasta {new Date(inv.expires_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Listo para usar
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant={inv.is_active ? "ghost" : "outline"}
                          disabled={inv.is_active || inv.quantity <= 0}
                          onClick={() => activateItem(inv.id)}
                          className="h-7 text-[11px] px-2"
                        >
                          {inv.is_active ? "En uso" : "Activar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'text-slate-500 border-slate-200';
    case 'rare': return 'text-blue-500 border-blue-200';
    case 'epic': return 'text-purple-500 border-purple-200';
    case 'legendary': return 'text-orange-500 border-orange-200';
    default: return '';
  }
}
