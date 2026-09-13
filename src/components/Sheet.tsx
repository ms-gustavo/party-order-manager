import { useEffect, useRef, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
}

/** Painel que sobe da parte de baixo da tela, estilo app de celular. */
export default function Sheet({ open, title, onClose, children, testId }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Em ref pra que um onClose recriado a cada render não roube o foco de volta
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstField = panelRef.current?.querySelector<HTMLElement>("input, button:not([data-scrim])");
    (firstField ?? panelRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        data-scrim
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-[#0a0d14]/50"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-testid={testId}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] max-w-md animate-sheet-in flex-col gap-3.5 overflow-y-auto rounded-t-[26px] bg-surface px-[18px] pb-[max(22px,env(safe-area-inset-bottom))] pt-2.5 focus:outline-none"
      >
        <div className="h-[5px] w-10 flex-none self-center rounded-full bg-line" />
        <h2 className="text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
