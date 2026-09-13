import type { BillState } from "../types";
import { computeBill } from "./bill";
import { formatBRL, formatPercent } from "./money";

export function buildShareText(state: BillState, date = new Date()): string {
  const bill = computeBill(state);
  const title = state.tableName.trim() || "Comanda";
  const day = date.toLocaleDateString("pt-BR");
  // Espaço normal no lugar do não-quebrável que o Intl coloca após "R$"
  const money = (cents: number) => formatBRL(cents).replace(/\s/g, " ");

  const totalLine =
    state.tipPercent > 0
      ? `Total c/ ${formatPercent(state.tipPercent)} de serviço: ${money(bill.total)}`
      : `Total: ${money(bill.total)}`;

  return [
    `🍻 *${title}* · ${day}`,
    "",
    ...bill.rows.map((r) =>
      r.person.paid
        ? `${r.person.name}: ${money(r.total)} ✅ pago`
        : `${r.person.name}: *${money(r.total)}*`
    ),
    "",
    totalLine,
    ...(bill.paid > 0 ? [`Falta pagar: *${money(bill.remaining)}*`] : []),
    ...(bill.change > 0 ? [`Troco a devolver: ${money(bill.change)}`] : []),
  ].join("\n");
}
