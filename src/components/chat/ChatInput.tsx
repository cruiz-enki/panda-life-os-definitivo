/**
 * **Componente** — Input del chat con la IA: textarea autoexpandible + envío.
 */
import { useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur p-3 pb-safe">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 160) + "px";
          }}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Pregunta a tu coach…"
          className="flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          aria-label="Enviar"
          className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow disabled:opacity-40 disabled:shadow-none active:scale-95 transition-transform"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
