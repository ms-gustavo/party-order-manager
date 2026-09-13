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
        {bill.rows.map(({ person, consumption, tip, owed, total, adjustment }) => (
          <li
            key={person.id}
            data-testid="receipt-row"
            data-person-name={person.name}
            data-paid={!!person.paid}
            className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 py-1.5 font-mono text-sm tabular-nums"
          >
            <span className="flex items-center gap-2 font-sans text-[15px] font-semibold">
              <Avatar person={person} size="sm" className={person.paid ? "opacity-50 grayscale" : ""} />
              <span className={person.paid ? "text-muted" : ""}>{person.name}</span>
              {person.paid && <span className="stamp ml-0.5">Pago</span>}
            </span>
            <span aria-hidden="true" className="-translate-y-1 border-b-[1.5px] border-dotted border-receipt-line" />
            <span className={`text-right ${person.paid ? "text-muted" : ""}`}>
              <span data-testid="receipt-row-total" className={person.paid ? "line-through decoration-danger/60" : ""}>
                {formatBRL(total)}
              </span>
              {person.paid && adjustment !== 0 ? (
                <small className="block text-[11px] text-muted">gastou {formatBRL(owed)}</small>
              ) : (
                (hasTip || tip > 0) && (
                  <small className="block text-[11px] text-muted">
                    {formatBRL(consumption)} + {formatBRL(tip)}
                  </small>
                )
              )}
              {!person.paid && adjustment !== 0 && (
                <small data-testid="receipt-row-adjustment" className="block text-[11px] text-muted">
                  {adjustment < 0
                    ? `− ${formatBRL(-adjustment)} de desconto`
                    : `+ ${formatBRL(adjustment)} que faltou`}
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
      {bill.tip > 0 && (
        <p className="flex justify-between py-0.5 font-mono text-[12.5px] text-muted">
          {/* Com alguém pago, a taxa pode ter mudado no meio: sem porcentagem única */}
          <span>Serviço{hasTip && bill.paid === 0 ? ` (${formatPercent(tipPercent)})` : ""}</span>
          <span data-testid="receipt-tip">{formatBRL(bill.tip)}</span>
        </p>
      )}
      {bill.paid > 0 && (
        <>
          <p className="flex justify-between py-0.5 font-mono text-[12.5px] text-muted">
            <span>Já pago</span>
            <span data-testid="receipt-paid">− {formatBRL(bill.paid)}</span>
          </p>
          <p className="mt-1 flex justify-between font-mono text-sm font-semibold">
            <span>Falta pagar</span>
            <span data-testid="receipt-remaining">{formatBRL(bill.remaining)}</span>
          </p>
          {bill.change > 0 && (
            <p className="flex justify-between font-mono text-sm font-semibold text-danger">
              <span>Troco a devolver</span>
              <span data-testid="receipt-change">{formatBRL(bill.change)}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
