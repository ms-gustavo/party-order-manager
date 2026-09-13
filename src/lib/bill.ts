import type { BillState, Item, Person } from "../types";

export const MIN_TIP = 0;
export const MAX_TIP = 30;
export const TIP_PRESETS = [0, 8, 10, 12, 15];

export function clampTip(percent: number): number {
  const rounded = Math.round(percent * 2) / 2;
  return Math.min(MAX_TIP, Math.max(MIN_TIP, rounded));
}

/** Quem ainda está na mesa, ou seja, quem não pagou. */
export function activePeople(people: Person[]): Person[] {
  return people.filter((p) => !p.paid);
}

export function itemConsumers(item: Item, people: Person[]): Person[] {
  return people.filter((p) => item.consumerIds.includes(p.id));
}

/**
 * Um item fica travado quando alguém que já pagou dividiu ele:
 * mexer nele mudaria um valor que já foi acertado.
 */
export function isItemLocked(item: Item, people: Person[]): boolean {
  return people.some((p) => p.paid && item.consumerIds.includes(p.id));
}

/** Pessoas que já pagaram e dividiram o item. */
export function paidConsumers(item: Item, people: Person[]): Person[] {
  return itemConsumers(item, people).filter((p) => p.paid);
}

/** "Todos" = item destravado que inclui todo mundo que está na mesa. */
export function isSharedByAll(item: Item, people: Person[]): boolean {
  if (isItemLocked(item, people)) return false;
  return activePeople(people).every((p) => item.consumerIds.includes(p.id));
}

/** Pessoa ainda sem pagar que divide algum item travado. */
export function sharesLockedItem(personId: string, state: BillState): boolean {
  return state.items.some(
    (item) => item.consumerIds.includes(personId) && isItemLocked(item, state.people)
  );
}

/**
 * Alterna uma pessoa na seleção de quem consumiu.
 * - Partindo de "todos", seleciona só a pessoa tocada.
 * - Nunca deixa a seleção vazia (retorna `undefined` pra avisar).
 */
export function toggleConsumer(
  current: string[],
  personId: string,
  allIds: string[]
): string[] | undefined {
  const all = allIds.every((id) => current.includes(id));
  if (all) return [personId];
  if (current.includes(personId)) {
    return current.length === 1 ? undefined : current.filter((id) => id !== personId);
  }
  return [...current, personId];
}

export interface PersonTotal {
  person: Person;
  consumption: number;
  tip: number;
  /** Consumo + taxa: o que a pessoa gastou. */
  owed: number;
  /**
   * Quanto a pessoa paga (ou pagou, se já fechou a conta). Pra quem está
   * na mesa, já inclui o desconto ou o acréscimo de quem pagou diferente.
   */
  total: number;
  /** `total - owed`: negativo é desconto, positivo é o que sobrou pra ela cobrir. */
  adjustment: number;
}

export interface BillSummary {
  rows: PersonTotal[];
  consumption: number;
  tip: number;
  /** Total gasto pela mesa (consumo + taxa). */
  total: number;
  /** Quanto já foi pago por quem fechou a conta. */
  paid: number;
  /** Quanto falta a mesa pagar. */
  remaining: number;
  /** Quanto foi pago além do total da mesa (troco a devolver). */
  change: number;
}

/** Consumo de cada pessoa a partir dos itens, em centavos. */
function consumptionByPerson({ people, items }: BillState): Map<string, number> {
  const consumption = new Map(people.map((p) => [p.id, 0]));

  for (const item of items) {
    // Mantém a ordem da mesa, pra sobra de centavos ser determinística
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

  return consumption;
}

/**
 * Reparte `amount` centavos proporcionalmente aos pesos, sem perder
 * nenhum centavo (maiores restos primeiro). Sem peso nenhum, divide igual.
 */
export function allocate(amount: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const base = weights.some((w) => w > 0) ? weights : weights.map(() => 1);
  const sum = base.reduce((a, b) => a + b, 0);

  const exact = base.map((w) => (amount * w) / sum);
  const shares = exact.map(Math.floor);
  let leftover = amount - shares.reduce((a, b) => a + b, 0);

  exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
    .forEach(({ index }) => {
      if (leftover-- > 0) shares[index] += 1;
    });

  return shares;
}

/** Consumo e taxa de uma pessoa agora, sem considerar pagamentos de outros. */
export function personDue(personId: string, state: BillState): { consumption: number; tip: number } {
  const consumption = consumptionByPerson(state).get(personId) ?? 0;
  return { consumption, tip: Math.round((consumption * state.tipPercent) / 100) };
}

/**
 * Fecha a conta por pessoa, tudo em centavos.
 *
 * - Centavos que sobram numa divisão vão pra quem vem primeiro na lista.
 * - Quem já pagou mantém consumo e taxa congelados, então mudar a taxa
 *   depois só afeta quem ainda está na mesa.
 * - O que falta pagar é sempre `total da mesa − já pago`, repartido entre
 *   quem está na mesa na proporção do que cada um gastou. Assim, quem pagou
 *   a mais vira desconto e quem pagou a menos vira acréscimo pros outros.
 */
export function computeBill(state: BillState): BillSummary {
  const consumption = consumptionByPerson(state);

  const base = state.people.map((person) => {
    const { consumption: sub, tip } = person.paid ?? {
      consumption: consumption.get(person.id)!,
      tip: Math.round((consumption.get(person.id)! * state.tipPercent) / 100),
    };
    return { person, consumption: sub, tip, owed: sub + tip };
  });

  const total = base.reduce((acc, row) => acc + row.owed, 0);
  const paid = base.reduce((acc, row) => acc + (row.person.paid?.amount ?? 0), 0);
  const pending = total - paid;

  const active = base.filter((row) => !row.person.paid);
  const shares = allocate(Math.max(0, pending), active.map((row) => row.owed));
  const shareOf = new Map(active.map((row, i) => [row.person.id, shares[i]]));

  const rows = base.map((row) => {
    const pays = row.person.paid ? row.person.paid.amount : shareOf.get(row.person.id)!;
    return { ...row, total: pays, adjustment: pays - row.owed };
  });

  return {
    rows,
    consumption: base.reduce((acc, row) => acc + row.consumption, 0),
    tip: base.reduce((acc, row) => acc + row.tip, 0),
    total,
    paid,
    remaining: Math.max(0, pending),
    change: Math.max(0, -pending),
  };
}
