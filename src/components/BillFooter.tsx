import type { BillSummary } from "../lib/bill";
import { formatBRL, formatPercent } from "../lib/money";

interface BillFooterProps {
  bill: BillSummary;
  tipPercent: number;
  onShare: () => void;
}

export default function BillFooter({ bill, tipPercent, onShare }: BillFooterProps) {
  // Depois que alguém pagou, o que importa pra mesa é quanto ainda falta
  const [label, value] =
    bill.change > 0
      ? ["Pago a mais · troco a devolver", bill.change]
      : bill.paid > 0
        ? [`Falta pagar · de ${formatBRL(bill.total)}`, bill.remaining]
        : [tipPercent > 0 ? `Total c/ ${formatPercent(tipPercent)} serviço` : "Total da mesa", bill.total];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[26px] bg-foot-bg py-3 pl-5 pr-3 text-foot-ink shadow-[0_12px_30px_-12px_rgba(20,30,70,.55)]">
        <div className="min-w-0">
          <p data-testid="bill-label" className="truncate text-[11.5px] uppercase tracking-[0.04em] opacity-75">
            {label}
          </p>
          <p data-testid="bill-total" className="font-display text-2xl leading-tight tracking-[0.01em]">
            {formatBRL(value)}
          </p>
        </div>
        <button
          onClick={onShare}
          disabled={bill.total === 0}
          data-testid="share-button"
          className="flex flex-none items-center gap-2 rounded-[18px] bg-hi px-4 py-3 font-bold text-[#2A1F00] transition active:scale-[0.97] disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="m16 6-4-4-4 4" />
            <path d="M12 2v13" />
          </svg>
          Dividir
        </button>
      </div>
    </div>
  );
}
