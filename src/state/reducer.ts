import type { BillState, Item } from "../types";
import { activePeople, clampTip, isItemLocked, personDue, sharesLockedItem } from "../lib/bill";

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
  | { type: "settlePerson"; id: string; at: number; amount: number }
  | { type: "updatePayment"; id: string; amount: number }
  | { type: "undoSettlement"; id: string }
  | { type: "setTip"; percent: number }
  | { type: "addItem"; item: Omit<Item, "id"> }
  | { type: "removeItem"; id: string }
  | { type: "changeQuantity"; id: string; delta: number }
  | { type: "setConsumers"; id: string; consumerIds: string[] }
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

const isValidAmount = (amount: number) => Number.isInteger(amount) && amount >= 0;

/** Aplica `update` só se o item existir e não estiver travado por um pagamento. */
function updateUnlockedItem(
  state: BillState,
  id: string,
  update: (item: Item) => Item | null
): BillState {
  const item = state.items.find((i) => i.id === id);
  if (!item || isItemLocked(item, state.people)) return state;
  const next = update(item);
  return {
    ...state,
    items: next
      ? state.items.map((i) => (i.id === id ? next : i))
      : state.items.filter((i) => i.id !== id),
  };
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
        people: [
          ...state.people,
          { id: newId(), name, color: nextColor(state), paid: null },
        ],
      };
    }

    case "removePerson": {
      // Remover é pra quem foi cadastrado errado. Quem pagou, ou divide
      // algo com quem pagou, não pode sair sem mudar um valor já acertado.
      const person = state.people.find((p) => p.id === action.id);
      if (!person || person.paid || sharesLockedItem(action.id, state)) return state;

      const people = state.people.filter((p) => p.id !== action.id);
      const remainingIds = activePeople(people).map((p) => p.id);
      return {
        ...state,
        people,
        items: state.items.map((item) => {
          if (!item.consumerIds.includes(action.id)) return item;
          const consumerIds = item.consumerIds.filter((id) => id !== action.id);
          // Se só essa pessoa tinha consumido, o item passa pra quem ficou
          return { ...item, consumerIds: consumerIds.length ? consumerIds : remainingIds };
        }),
      };
    }

    case "settlePerson": {
      const person = state.people.find((p) => p.id === action.id);
      if (!person || person.paid || !isValidAmount(action.amount)) return state;
      const { consumption, tip } = personDue(action.id, state);
      const paid = { consumption, tip, amount: action.amount, at: action.at };
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.id ? { ...p, paid } : p)),
      };
    }

    case "updatePayment": {
      if (!isValidAmount(action.amount)) return state;
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.id && p.paid ? { ...p, paid: { ...p.paid, amount: action.amount } } : p
        ),
      };
    }

    case "undoSettlement":
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.id ? { ...p, paid: null } : p)),
      };

    case "setTip":
      return { ...state, tipPercent: clampTip(action.percent) };

    case "addItem": {
      const name = action.item.name.trim();
      const activeIds = new Set(activePeople(state.people).map((p) => p.id));
      const consumerIds = action.item.consumerIds.filter((id) => activeIds.has(id));
      if (!name || action.item.unitPrice <= 0 || action.item.quantity < 1 || !consumerIds.length) {
        return state;
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, name, consumerIds, id: newId() }],
      };
    }

    case "removeItem":
      return updateUnlockedItem(state, action.id, () => null);

    case "changeQuantity":
      return updateUnlockedItem(state, action.id, (item) => ({
        ...item,
        quantity: Math.max(1, item.quantity + action.delta),
      }));

    case "setConsumers": {
      const activeIds = new Set(activePeople(state.people).map((p) => p.id));
      const consumerIds = action.consumerIds.filter((id) => activeIds.has(id));
      if (!consumerIds.length) return state;
      return updateUnlockedItem(state, action.id, (item) => ({ ...item, consumerIds }));
    }

    case "reset":
      return initialState;
  }
}
