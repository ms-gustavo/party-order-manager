import { describe, expect, it } from "vitest";
import type { BillState, Person } from "../types";
import {
  allocate,
  clampTip,
  computeBill,
  isItemLocked,
  isSharedByAll,
  personDue,
  toggleConsumer,
} from "./bill";

const person = (id: string, name: string): Person => ({ id, name, color: "#000", paid: null });
const people = [person("g", "Gustavo"), person("a", "Ana"), person("l", "Léo")];
const everyone = ["g", "a", "l"];

const bill = (overrides: Partial<BillState>): BillState => ({
  tableName: "",
  people,
  items: [],
  tipPercent: 0,
  ...overrides,
});

describe("computeBill", () => {
  it("divide item de todos igualmente", () => {
    const result = computeBill(
      bill({ items: [{ id: "1", name: "Batata", unitPrice: 3000, quantity: 1, consumerIds: everyone }] })
    );
    expect(result.rows.map((r) => r.total)).toEqual([1000, 1000, 1000]);
    expect(result.total).toBe(3000);
    expect(result.remaining).toBe(3000);
  });

  it("distribui centavos que sobram sem perder nenhum", () => {
    const result = computeBill(
      bill({ items: [{ id: "1", name: "Batata", unitPrice: 1000, quantity: 1, consumerIds: everyone }] })
    );
    expect(result.rows.map((r) => r.consumption)).toEqual([334, 333, 333]);
    expect(result.consumption).toBe(1000);
  });

  it("cobra só de quem consumiu, considerando a quantidade", () => {
    const result = computeBill(
      bill({ items: [{ id: "1", name: "Chopp", unitPrice: 1400, quantity: 5, consumerIds: ["g", "l"] }] })
    );
    expect(result.rows.map((r) => r.consumption)).toEqual([3500, 0, 3500]);
  });

  it("aplica a taxa de serviço sobre o consumo de cada um", () => {
    const result = computeBill(
      bill({
        tipPercent: 12.5,
        items: [{ id: "1", name: "Vinho", unitPrice: 8000, quantity: 1, consumerIds: ["a"] }],
      })
    );
    expect(result.rows[1]).toMatchObject({ consumption: 8000, tip: 1000, total: 9000 });
    expect(result.tip).toBe(1000);
    expect(result.total).toBe(9000);
  });

  it("usa o valor congelado de quem já pagou e calcula quanto falta", () => {
    const paidAna = { ...people[1], paid: { consumption: 1000, tip: 100, amount: 1100, at: 0 } };
    const result = computeBill(
      bill({
        tipPercent: 20, // taxa mudou depois que a Ana pagou 10%
        people: [people[0], paidAna, people[2]],
        items: [{ id: "1", name: "Batata", unitPrice: 3000, quantity: 1, consumerIds: everyone }],
      })
    );
    expect(result.rows.map((r) => r.total)).toEqual([1200, 1100, 1200]);
    expect(result.paid).toBe(1100);
    expect(result.remaining).toBe(2400);
  });
});

describe("pagamento diferente do devido", () => {
  const batata = { id: "1", name: "Batata", unitPrice: 3000, quantity: 1, consumerIds: everyone };
  const chopp = { id: "2", name: "Chopp", unitPrice: 3000, quantity: 1, consumerIds: ["g"] };
  const paying = (amount: number): Person => ({
    ...people[1],
    paid: { consumption: 1000, tip: 0, amount, at: 0 },
  });

  it("quem pagou a mais vira desconto proporcional pra quem ficou", () => {
    // Gustavo gastou 40, Léo 10; Ana devia 10 e pagou 20
    const result = computeBill(bill({ people: [people[0], paying(2000), people[2]], items: [batata, chopp] }));
    expect(result.rows.map((r) => r.total)).toEqual([3200, 2000, 800]);
    expect(result.rows.map((r) => r.adjustment)).toEqual([-800, 1000, -200]);
    expect(result).toMatchObject({ total: 6000, paid: 2000, remaining: 4000, change: 0 });
  });

  it("quem pagou a menos deixa o que faltou pra quem ficou", () => {
    const result = computeBill(bill({ people: [people[0], paying(500), people[2]], items: [batata, chopp] }));
    expect(result.rows.map((r) => r.total)).toEqual([4400, 500, 1100]);
    expect(result.remaining).toBe(5500);
  });

  it("mostra o troco quando pagam mais que a mesa inteira", () => {
    const result = computeBill(bill({ people: [people[0], paying(9000), people[2]], items: [batata, chopp] }));
    expect(result.rows.map((r) => r.total)).toEqual([0, 9000, 0]);
    expect(result).toMatchObject({ remaining: 0, change: 3000 });
  });

  it("quem sai depois paga o valor já com o ajuste de quem saiu antes", () => {
    const state = bill({ people: [people[0], paying(2000), people[2]], items: [batata, chopp] });
    const gustavoPays = computeBill(state).rows[0].total;
    const next = computeBill({
      ...state,
      people: [
        { ...people[0], paid: { consumption: 4000, tip: 0, amount: gustavoPays, at: 1 } },
        state.people[1],
        people[2],
      ],
    });
    expect(next.rows[2].total).toBe(800);
    expect(next.remaining).toBe(800);
  });
});

describe("allocate", () => {
  it("reparte sem perder centavos", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(1000, [3, 1])).toEqual([750, 250]);
  });

  it("divide igual quando ninguém tem peso", () => {
    expect(allocate(500, [0, 0])).toEqual([250, 250]);
    expect(allocate(500, [])).toEqual([]);
  });
});

describe("personDue", () => {
  it("calcula o que a pessoa deve agora", () => {
    const state = bill({
      tipPercent: 10,
      items: [{ id: "1", name: "Batata", unitPrice: 3000, quantity: 1, consumerIds: everyone }],
    });
    expect(personDue("a", state)).toEqual({ consumption: 1000, tip: 100 });
  });
});

describe("travas e 'Todos'", () => {
  const paidAna = { ...people[1], paid: { consumption: 0, tip: 0, amount: 0, at: 0 } };
  const batata = { id: "1", name: "Batata", unitPrice: 3000, quantity: 1, consumerIds: everyone };

  it("trava itens divididos com quem já pagou", () => {
    expect(isItemLocked(batata, [people[0], paidAna, people[2]])).toBe(true);
    expect(isItemLocked({ ...batata, consumerIds: ["g", "l"] }, [people[0], paidAna, people[2]])).toBe(false);
  });

  it("'Todos' considera só quem está na mesa e nunca item travado", () => {
    const mesa = [people[0], paidAna, people[2]];
    expect(isSharedByAll({ ...batata, consumerIds: ["g", "l"] }, mesa)).toBe(true);
    expect(isSharedByAll(batata, mesa)).toBe(false);
  });

  it("quem chega depois não entra em 'Todos' de antes", () => {
    const mesa = [...people, person("b", "Bia")];
    expect(isSharedByAll(batata, mesa)).toBe(false);
  });
});

describe("toggleConsumer", () => {
  it("partindo de todos, seleciona só a pessoa tocada", () => {
    expect(toggleConsumer(everyone, "a", everyone)).toEqual(["a"]);
  });

  it("adiciona e remove pessoas", () => {
    expect(toggleConsumer(["a"], "g", everyone)).toEqual(["a", "g"]);
    expect(toggleConsumer(["a", "g"], "g", everyone)).toEqual(["a"]);
  });

  it("não deixa a seleção vazia", () => {
    expect(toggleConsumer(["a"], "a", everyone)).toBeUndefined();
  });

  it("chega em todos quando a mesa inteira fica selecionada", () => {
    expect(toggleConsumer(["a", "g"], "l", everyone)).toEqual(["a", "g", "l"]);
  });
});

describe("clampTip", () => {
  it("arredonda pra meio ponto e respeita os limites", () => {
    expect(clampTip(10.3)).toBe(10.5);
    expect(clampTip(-2)).toBe(0);
    expect(clampTip(45)).toBe(30);
  });
});
