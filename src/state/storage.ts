import type { BillState } from "../types";
import { clampTip } from "../lib/bill";
import { initialState } from "./reducer";

export const STORAGE_KEY = "comanda:v1";
const LEGACY_KEYS = ["sharedOrders", "individualOrders", "people"];

const isString = (v: unknown): v is string => typeof v === "string";
const isPositiveInt = (v: unknown, min: number): v is number =>
  Number.isInteger(v) && (v as number) >= min;

/** Garante que o que veio do localStorage tem o formato esperado. */
export function parseState(raw: unknown): BillState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;

  if (!Array.isArray(s.people) || !Array.isArray(s.items)) return null;
  if (typeof s.tipPercent !== "number" || !isString(s.tableName)) return null;

  const people = s.people.filter(
    (p): p is BillState["people"][number] =>
      !!p && isString(p.id) && isString(p.name) && isString(p.color)
  );
  const personIds = new Set(people.map((p) => p.id));

  const items = s.items
    .filter(
      (i): i is BillState["items"][number] =>
        !!i &&
        isString(i.id) &&
        isString(i.name) &&
        isPositiveInt(i.unitPrice, 1) &&
        isPositiveInt(i.quantity, 1) &&
        (i.consumerIds === null ||
          (Array.isArray(i.consumerIds) && i.consumerIds.every(isString)))
    )
    .map((i) => {
      if (!i.consumerIds) return i;
      const consumerIds = i.consumerIds.filter((id) => personIds.has(id));
      return { ...i, consumerIds: consumerIds.length ? consumerIds : null };
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
