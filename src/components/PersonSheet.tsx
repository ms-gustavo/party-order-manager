import { useState, type FormEvent } from "react";
import type { Person } from "../types";
import type { PersonTotal } from "../lib/bill";
import { formatBRL, formatPercent, parseBRL, roundUpOptions } from "../lib/money";
import Avatar from "./Avatar";
import Sheet from "./Sheet";

interface PersonSheetProps {
  row: PersonTotal | null;
  tipPercent: number;
  /** Tem mais alguém na mesa pra absorver diferença de pagamento? */
  othersAtTable: boolean;
  /** Divide item com quem já pagou: sair mudaria um valor já acertado. */
  removalBlocked: boolean;
  onClose: () => void;
  onSettle: (person: Person, amount: number) => void;
  onUpdatePayment: (person: Person, amount: number) => void;
  onUndo: (person: Person) => void;
  onRemove: (person: Person) => void;
}

const time = (at: number) =>
  new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const toInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export default function PersonSheet(props: PersonSheetProps) {
  const { row, onClose } = props;
  return (
    <Sheet open={!!row} title={row?.person.name ?? ""} onClose={onClose} testId="person-sheet" focusFirstField={false}>
      {/* key: troca de pessoa (ou pagamento) reinicia o formulário */}
      {row && <PersonPanel key={`${row.person.id}-${row.person.paid?.at ?? "open"}`} {...props} row={row} />}
    </Sheet>
  );
}

function PersonPanel({
  row,
  tipPercent,
  othersAtTable,
  removalBlocked,
  onSettle,
  onUpdatePayment,
  onUndo,
  onRemove,
}: PersonSheetProps & { row: PersonTotal }) {
  const { person } = row;
  const paid = person.paid;
  // Quem está na mesa começa com o que deve; quem pagou, com o que pagou
  const suggested = row.total;
  const [input, setInput] = useState(toInput(suggested));
  const amount = parseBRL(input);
  const valid = amount !== null;

  const reference = paid ? row.owed : suggested;
  const diff = valid ? amount - reference : 0;
  const changed = paid && valid && amount !== paid.amount;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    if (paid) onUpdatePayment(person, amount);
    else onSettle(person, amount);
  };

  let hint = "";
  if (!valid) hint = "Digite quanto foi pago, ex.: 40 ou 31,90.";
  else if (diff > 0)
    hint = othersAtTable
      ? `${formatBRL(diff)} a mais: vira desconto pra quem ficou.`
      : `${formatBRL(diff)} a mais: fica de troco pra mesa.`;
  else if (diff < 0)
    hint = othersAtTable
      ? `Faltam ${formatBRL(-diff)}: vão pra conta de quem ficou.`
      : `Faltam ${formatBRL(-diff)} pra fechar a mesa.`;

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl bg-receipt px-4 py-3.5">
        <Avatar person={person} className={paid ? "opacity-50 grayscale" : ""} />
        <div className="min-w-0 flex-1 font-mono text-[12.5px] leading-relaxed text-muted">
          <p>Consumo {formatBRL(row.consumption)}</p>
          {row.tip > 0 && (
            <p>
              Serviço {paid ? "" : `(${formatPercent(tipPercent)}) `}
              {formatBRL(row.tip)}
            </p>
          )}
          {!paid && row.adjustment !== 0 && (
            <p data-testid="person-sheet-adjustment">
              {row.adjustment < 0 ? "Desconto" : "Acréscimo"} {formatBRL(Math.abs(row.adjustment))}
            </p>
          )}
        </div>
        <div className="text-right">
          {paid && <span className="stamp mb-1">Pago</span>}
          <p data-testid="person-sheet-total" className="font-display text-2xl leading-none">
            {formatBRL(row.total)}
          </p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-2.5">
        <label htmlFor="person-amount" className="text-[12.5px] font-semibold text-muted">
          {paid ? `Pagou às ${time(paid.at)}. Valor pago:` : "Quanto vai pagar?"}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted">R$</span>
            <input
              id="person-amount"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              inputMode="decimal"
              autoComplete="off"
              data-testid="person-amount"
              className="field-input pl-11 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {!paid &&
            roundUpOptions(suggested).map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setInput(toInput(value))}
                data-testid="person-round"
                className="rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[13px] font-semibold transition hover:border-muted"
              >
                {formatBRL(value)}
              </button>
            ))}
          {valid && amount !== reference && (
            <button
              type="button"
              onClick={() => setInput(toInput(reference))}
              className="rounded-full px-2 py-1 text-[13px] font-semibold text-pen hover:underline"
            >
              {paid ? "Usar o que consumiu" : "Valor exato"}
            </button>
          )}
        </div>

        <p
          data-testid="person-amount-hint"
          className={`min-h-[18px] text-[13px] ${valid ? "text-muted" : "font-semibold text-danger"}`}
        >
          {hint}
        </p>

        {!paid && (
          <button type="submit" disabled={!valid} data-testid="person-settle" className="btn-primary">
            {person.name} pagou {valid ? formatBRL(amount) : "…"}
          </button>
        )}
        {paid && changed && (
          <button type="submit" data-testid="person-update-payment" className="btn-primary">
            Salvar valor pago
          </button>
        )}
      </form>

      {paid ? (
        <button onClick={() => onUndo(person)} data-testid="person-undo" className="btn-ghost">
          Desfazer pagamento
        </button>
      ) : (
        <div className="mt-1 border-t border-dashed border-line pt-3">
          {removalBlocked ? (
            <p className="text-[13px] text-muted">
              Não dá pra remover: {person.name} divide itens com quem já pagou.
            </p>
          ) : (
            <>
              <button
                onClick={() => onRemove(person)}
                data-testid="person-remove-confirm"
                className="text-sm font-semibold text-danger hover:underline"
              >
                Remover da mesa
              </button>
              <p className="mt-0.5 text-[12.5px] text-muted">
                Só pra quem foi cadastrado errado. O consumo vai pra divisão de quem ficou.
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
