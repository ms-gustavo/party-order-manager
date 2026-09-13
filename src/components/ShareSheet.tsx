import Sheet from "./Sheet";
import type { Notify } from "../hooks/useToast";

interface ShareSheetProps {
  open: boolean;
  text: string;
  onClose: () => void;
  notify: Notify;
}

export default function ShareSheet({ open, text, onClose, notify }: ShareSheetProps) {
  const sendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    onClose();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Texto copiado");
      onClose();
    } catch {
      notify("Não deu pra copiar. Selecione o texto e copie na mão.");
    }
  };

  return (
    <Sheet open={open} title="Mandar a conta no grupo" onClose={onClose} testId="share-sheet">
      <div className="rounded-2xl bg-surface-2 p-3.5">
        <p
          data-testid="share-text"
          className="select-text whitespace-pre-wrap rounded-xl rounded-bl-sm bg-[#DCF8C6] px-3.5 py-3 text-sm leading-relaxed text-[#111B21] shadow-[0_1px_0_rgba(0,0,0,.08)]"
        >
          {text}
        </p>
      </div>
      <button onClick={sendWhatsApp} data-testid="share-whatsapp" className="btn-primary">
        Enviar no WhatsApp
      </button>
      <button onClick={copy} data-testid="share-copy" className="btn-ghost">
        Copiar texto
      </button>
    </Sheet>
  );
}
