import type { BillState, Payment } from "../types";
import { clampTip } from "../lib/bill";
import { initialState } from "./reducer";

export const STORAGE_KEY = "comanda:v1";
const LEGACY_KEYS = ["sharedOrders", "individualOrders", "people"];

const isString = (v: unknown): v is string => typeof v === "string";
const isIntAtLeast = (v: unknown, min: number): v is number =>
  Number.isInteger(v) && (v as number) >= min;

function parsePayment(raw: unknown): Payment | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (
    !isIntAtLeast(p.consumption, 0) ||
    !isIntAtLeast(p.tip, 0) ||
    !isIntAtLeast(p.amount, 0) ||
    typeof p.at !== "number"
  ) {
    return null;
  }
  return { consumption: p.consumption, tip: p.tip, amount: p.amount, at: p.at };
}

/** Garante que o que veio do localStorage tem o formato esperado. */
export function parseState(raw: unknown): BillState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;

  if (!Array.isArray(s.people) || !Array.isArray(s.items)) return null;
  if (typeof s.tipPercent !== "number" || !isString(s.tableName)) return null;

  const people = s.people
    .filter((p) => !!p && isString(p.id) && isString(p.name) && isString(p.color))
    .map((p) => ({ id: p.id, name: p.name, color: p.color, paid: parsePayment(p.paid) }));
  const personIds = people.map((p) => p.id);

  const items = s.items
    .filter(
      (i) =>
        !!i &&
        isString(i.id) &&
        isString(i.name) &&
        isIntAtLeast(i.unitPrice, 1) &&
        isIntAtLeast(i.quantity, 1) &&
        // `null` era "todos" na primeira versão do modelo
        (i.consumerIds === null ||
          (Array.isArray(i.consumerIds) && i.consumerIds.every(isString)))
    )
    .map((i) => {
      const known = (i.consumerIds ?? personIds).filter((id: string) => personIds.includes(id));
      return {
        id: i.id as string,
        name: i.name as string,
        unitPrice: i.unitPrice as number,
        quantity: i.quantity as number,
        consumerIds: known.length ? known : personIds,
      };
    });

  return {
    tableName: s.tableName,
    people,
    items,
    tipPercent: clampTip(s.tipPercent),
  };
}

export function loadState(): BillState {
  try {
    // Os dados da versão antiga não têm como virar o modelo novo
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved && parseState(JSON.parse(saved))) || initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state: BillState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Navegação privada ou armazenamento cheio: o app segue funcionando em memória
  }
}
