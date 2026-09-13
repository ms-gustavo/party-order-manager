import type { BillState, Item, Person } from "../types";

export const MIN_TIP = 0;
export const MAX_TIP = 30;
export const TIP_PRESETS = [0, 8, 10, 12, 15];

export function clampTip(percent: number): number {
  const rounded = Math.round(percent * 2) / 2;
  return Math.min(MAX_TIP, Math.max(MIN_TIP, rounded));
}

export function itemConsumers(item: Item, people: Person[]): Person[] {
  if (!item.consumerIds) return people;
  return people.filter((p) => item.consumerIds!.includes(p.id));
}

export function isSharedByAll(item: Item, people: Person[]): boolean {
  return (
    !item.consumerIds ||
    people.every((p) => item.consumerIds!.includes(p.id))
  );
}

/**
 * Alterna uma pessoa na seleção de quem consumiu.
 * - Partindo de "todos", seleciona só a pessoa tocada.
 * - Nunca deixa a seleção vazia (retorna `undefined` pra avisar).
 * - Se todo mundo acabar selecionado, volta pra `null` ("todos").
 */
export function toggleConsumer(
  current: string[] | null,
  personId: string,
  allIds: string[]
): string[] | null | undefined {
  let next: string[];
  if (!current) {
    next = [personId];
  } else if (current.includes(personId)) {
    if (current.length === 1) return undefined;
    next = current.filter((id) => id !== personId);
  } else {
    next = [...current, personId];
  }
  return allIds.every((id) => next.includes(id)) ? null : next;
}

export interface PersonTotal {
  person: Person;
  consumption: number;
  tip: number;
  total: number;
}

export interface BillSummary {
  rows: PersonTotal[];
  consumption: number;
  tip: number;
  total: number;
}

/**
 * Fecha a conta por pessoa, tudo em centavos.
 * Os centavos que sobram numa divisão vão pra quem vem primeiro
 * na lista, então a soma das pessoas sempre bate com o total.
 */
export function computeBill({ people, items, tipPercent }: BillState): BillSummary {
  const consumption = new Map(people.map((p) => [p.id, 0]));

  for (const item of items) {
    const consumers = itemConsumers(item, people);
    if (consumers.length === 0) continue;

    const itemTotal = item.unitPrice * item.quantity;
    const share = Math.floor(itemTotal / consumers.length);
    let remainder = itemTotal - share * consumers.length;

    for (const person of consumers) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      consumption.set(person.id, consumption.get(person.id)! + share + extra);
    }
  }

  const rows = people.map((person) => {
    const sub = consumption.get(person.id)!;
    const tip = Math.round((sub * tipPercent) / 100);
    return { person, consumption: sub, tip, total: sub + tip };
  });

  const sum = (key: "consumption" | "tip" | "total") =>
    rows.reduce((acc, row) => acc + row[key], 0);

  return {
    rows,
    consumption: sum("consumption"),
    tip: sum("tip"),
    total: sum("total"),
  };
}
