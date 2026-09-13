import type { BillSummary } from "../lib/bill";
import { formatBRL, formatPercent } from "../lib/money";
import Avatar from "./Avatar";

interface ReceiptProps {
  bill: BillSummary;
  tipPercent: number;
}

/** O fechamento, com cara de comanda de papel carbono. */
export default function Receipt({ bill, tipPercent }: ReceiptProps) {
  const hasTip = tipPercent > 0;

  return (
    <section
      aria-labelledby="receipt-title"
      data-testid="receipt"
      className="receipt-edge mt-1.5 bg-receipt px-[18px] pb-[22px] pt-[18px]"
    >
      <h2 id="receipt-title" className="mb-3 mt-1.5 text-center font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Fechamento · {new Date().toLocaleDateString("pt-BR")}
      </h2>

      <ul>
        {bill.rows.map(({ person, consumption, tip, total }) => (
          <li
            key={person.id}
            data-testid="receipt-row"
            data-person-name={person.name}
            className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 py-1.5 font-mono text-sm tabular-nums"
          >
            <span className="flex items-center gap-2 font-sans text-[15px] font-semibold">
              <Avatar person={person} size="sm" />
              {person.name}
            </span>
            <span aria-hidden="true" className="-translate-y-1 border-b-[1.5px] border-dotted border-receipt-line" />
            <span className="text-right">
              <span data-testid="receipt-row-total">{formatBRL(total)}</span>
              {hasTip && (
                <small className="block text-[11px] text-muted">
                  {formatBRL(consumption)} + {formatBRL(tip)}
                </small>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mb-1.5 mt-2.5 border-t-[1.5px] border-dashed border-receipt-line" />
      <p className="flex justify-between py-0.5 font-mono text-[12.5px] text-muted">
        <span>Consumo</span>
        <span data-testid="receipt-consumption">{formatBRL(bill.consumption)}</span>
      </p>
      {hasTip && (
        <p className="flex justify-between py-0.5 font-mono text-[12.5px] text-muted">
          <span>Serviço ({formatPercent(tipPercent)})</span>
          <span data-testid="receipt-tip">{formatBRL(bill.tip)}</span>
        </p>
      )}
    </section>
  );
}
