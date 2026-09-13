import type { BillState, Item } from "../types";
import { clampTip } from "../lib/bill";

export const PERSON_COLORS = [
  "#1F3F9E", // caneta BIC
  "#C7321F", // carimbo
  "#2E7A66", // azulejo
  "#A8731A", // ocre
  "#B04A78", // carbono rosa
  "#6B4A33", // madeira
  "#4F6A8F", // ardósia
  "#3E3F47", // grafite
];

export const initialState: BillState = {
  tableName: "",
  people: [],
  items: [],
  tipPercent: 10,
};

export type Action =
  | { type: "setTableName"; name: string }
  | { type: "addPerson"; name: string }
  | { type: "removePerson"; id: string }
  | { type: "setTip"; percent: number }
  | { type: "addItem"; item: Omit<Item, "id"> }
  | { type: "removeItem"; id: string }
  | { type: "changeQuantity"; id: string; delta: number }
  | { type: "setConsumers"; id: string; consumerIds: string[] | null }
  | { type: "reset" };

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // randomUUID só existe em contexto seguro (ex.: acessando o dev server pelo IP)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextColor(state: BillState): string {
  const used = new Set(state.people.map((p) => p.color));
  return (
    PERSON_COLORS.find((c) => !used.has(c)) ??
    PERSON_COLORS[state.people.length % PERSON_COLORS.length]
  );
}

export function billReducer(state: BillState, action: Action): BillState {
  switch (action.type) {
    case "setTableName":
      return { ...state, tableName: action.name };

    case "addPerson": {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        people: [...state.people, { id: newId(), name, color: nextColor(state) }],
      };
    }

    case "removePerson":
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
        items: state.items.map((item) => {
          if (!item.consumerIds) return item;
          const consumerIds = item.consumerIds.filter((id) => id !== action.id);
          // Se só essa pessoa tinha consumido, o item passa a ser de todos
          return { ...item, consumerIds: consumerIds.length ? consumerIds : null };
        }),
      };

    case "setTip":
      return { ...state, tipPercent: clampTip(action.percent) };

    case "addItem": {
      const name = action.item.name.trim();
      if (!name || action.item.unitPrice <= 0 || action.item.quantity < 1) {
        return state;
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, name, id: newId() }],
      };
    }

    case "removeItem":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "changeQuantity":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: Math.max(1, i.quantity + action.delta) }
            : i
        ),
      };

    case "setConsumers":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, consumerIds: action.consumerIds } : i
        ),
      };

    case "reset":
      return initialState;
  }
}
