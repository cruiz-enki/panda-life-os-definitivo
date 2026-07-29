
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface MobileCollapsibleSectionProps {
  title: string;
  emoji?: string;
  badge?: string | number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function MobileCollapsibleSection({
  title,
  emoji,
  badge,
  children,
  defaultOpen = true,
  className,
}: MobileCollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("rounded-2xl border border-border bg-card overflow-hidden transition-all", className)}
    >
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left focus:outline-none">
          <div className="flex items-center gap-2">
            {emoji && <span className="text-base leading-none">{emoji}</span>}
            <h2 className="font-display text-sm font-bold">{title}</h2>
            {badge !== undefined && badge !== "" && (
              <span className="text-[11px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {badge}
              </span>
            )}
          </div>
          {/* Solo mostramos el Chevron en mobile o si queremos que siempre sea colapsable */}
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200 md:hidden", 
              isOpen ? "rotate-180" : ""
            )} 
          />
        </button>
      </CollapsibleTrigger>
      
      {/* En desktop (md+) siempre mostramos el contenido, en mobile respetamos el estado isOpen */}
      <div className="hidden md:block border-t border-border">
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
      
      <CollapsibleContent className="md:hidden">
        <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
