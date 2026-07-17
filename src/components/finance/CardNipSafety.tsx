/**
 * **Componente** — Bloqueo de seguridad por NIP para revelar datos sensibles de la tarjeta.
 */
import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import type { CreditCard } from "@/lib/finance-types";
import { toast } from "sonner";

export function CardNipSafety({ card }: { card: CreditCard }) {
  const { updateCard } = useFinance();
  const [showNip, setShowNip] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempNip, setTempNip] = useState(card.nip_code || "");

  const handleSave = async () => {
    const error = await updateCard(card.id, { nip_code: tempNip });
    if (!error) {
      toast.success("Información de seguridad actualizada");
      setIsEditing(false);
      setShowNip(false);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
          <ShieldCheck className="w-3 h-3 text-green-400" />
          Seguridad
        </div>
        {!isEditing && (
          <button 
            onClick={() => setShowNip(!showNip)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            {showNip ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex w-full gap-2">
            <input
              type="password"
              maxLength={4}
              value={tempNip}
              onChange={(e) => setTempNip(e.target.value.replace(/\D/g, ""))}
              className="bg-white/10 border-none rounded-lg px-3 py-1 text-sm w-full focus:ring-1 ring-white/30 text-white placeholder:text-white/20"
              placeholder="4 dígitos"
              autoFocus
            />
            <button 
              onClick={handleSave}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-[10px] font-bold"
            >
              OK
            </button>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="flex-1 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="text-xl font-mono tracking-[0.5em] text-white">
                {showNip && card.nip_code ? card.nip_code : "••••"}
              </div>
              {!card.nip_code && (
                <span className="text-[10px] text-white/40 italic group-hover:text-white/60">
                  Configurar NIP
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      <p className="text-[9px] text-white/40 mt-1 leading-tight">
        Almacenado localmente en tu nube privada Panda OS. Solo visible para ti.
      </p>
    </div>
  );
}
