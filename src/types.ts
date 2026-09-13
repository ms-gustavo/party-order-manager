export interface Payment {
  /** Consumo congelado no momento do pagamento, em centavos. */
  consumption: number;
  /** Taxa de serviço congelada no momento do pagamento, em centavos. */
  tip: number;
  /**
   * Quanto a pessoa realmente pagou, em centavos. Pode ser diferente de
   * consumo + taxa: o que passar vira desconto pra quem ficou, e o que
   * faltar vai pra conta deles.
   */
  amount: number;
  /** Timestamp (ms) de quando a conta foi fechada. */
  at: number;
}

export interface Person {
  id: string;
  name: string;
  color: string;
  /** Preenchido quando a pessoa pagou a parte dela e foi embora. */
  paid: Payment | null;
}

export interface Item {
  id: string;
  name: string;
  /** Preço de uma unidade, em centavos. */
  unitPrice: number;
  quantity: number;
  /**
   * Quem consumiu. "Todos" é gravado como a lista de quem estava na mesa
   * quando o item foi pedido, então quem chega depois não entra na divisão.
   */
  consumerIds: string[];
}

export interface BillState {
  tableName: string;
  people: Person[];
  items: Item[];
  /** Taxa de serviço em %, de 0 a 30, em passos de 0,5. */
  tipPercent: number;
}
