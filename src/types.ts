export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface Item {
  id: string;
  name: string;
  /** Preço de uma unidade, em centavos. */
  unitPrice: number;
  quantity: number;
  /** Quem consumiu. `null` significa todo mundo da mesa. */
  consumerIds: string[] | null;
}

export interface BillState {
  tableName: string;
  people: Person[];
  items: Item[];
  /** Taxa de serviço em %, de 0 a 30, em passos de 0,5. */
  tipPercent: number;
}
