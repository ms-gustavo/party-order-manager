import { describe, expect, it } from "vitest";
import type { BillState } from "../types";
import { clampTip, computeBill, isSharedByAll, toggleConsumer } from "./bill";

const people = [
  { id: "g", name: "Gustavo", color: "#000" },
  { id: "a", name: "Ana", color: "#000" },
  { id: "l", name: "Léo", color: "#000" },
];

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
      bill({
        items: [{ id: "1", name: "Batata", unitPrice: 3000, quantity: 1, consumerIds: null }],
      })
    );
    expect(result.rows.map((r) => r.total)).toEqual([1000, 1000, 1000]);
    expect(result.total).toBe(3000);
  });

  it("distribui centavos que sobram sem perder nenhum", () => {
    const result = computeBill(
      bill({
        items: [{ id: "1", name: "Batata", unitPrice: 1000, quantity: 1, consumerIds: null }],
      })
    );
    expect(result.rows.map((r) => r.consumption)).toEqual([334, 333, 333]);
    expect(result.consumption).toBe(1000);
  });

  it("cobra só de quem consumiu, considerando a quantidade", () => {
    const result = computeBill(
      bill({
        items: [{ id: "1", name: "Chopp", unitPrice: 1400, quantity: 5, consumerIds: ["g", "l"] }],
      })
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
    const ana = result.rows[1];
    expect(ana).toMatchObject({ consumption: 8000, tip: 1000, total: 9000 });
    expect(result.tip).toBe(1000);
    expect(result.total).toBe(9000);
  });

  it("ignora itens quando não há ninguém na mesa", () => {
    const result = computeBill(
      bill({
        people: [],
        items: [{ id: "1", name: "Água", unitPrice: 600, quantity: 1, consumerIds: null }],
      })
    );
    expect(result.total).toBe(0);
  });
});

describe("toggleConsumer", () => {
  const all = ["g", "a", "l"];

  it("partindo de todos, seleciona só a pessoa tocada", () => {
    expect(toggleConsumer(null, "a", all)).toEqual(["a"]);
  });

  it("adiciona e remove pessoas", () => {
    expect(toggleConsumer(["a"], "g", all)).toEqual(["a", "g"]);
    expect(toggleConsumer(["a", "g"], "g", all)).toEqual(["a"]);
  });

  it("não deixa a seleção vazia", () => {
    expect(toggleConsumer(["a"], "a", all)).toBeUndefined();
  });

  it("volta pra todos quando a mesa inteira fica selecionada", () => {
    expect(toggleConsumer(["a", "g"], "l", all)).toBeNull();
  });
});

describe("isSharedByAll", () => {
  it("reconhece seleção explícita de todo mundo", () => {
    const item = { id: "1", name: "x", unitPrice: 1, quantity: 1, consumerIds: ["g", "a", "l"] };
    expect(isSharedByAll(item, people)).toBe(true);
    expect(isSharedByAll({ ...item, consumerIds: ["g"] }, people)).toBe(false);
  });
});

describe("clampTip", () => {
  it("arredonda pra meio ponto e respeita os limites", () => {
    expect(clampTip(10.3)).toBe(10.5);
    expect(clampTip(-2)).toBe(0);
    expect(clampTip(45)).toBe(30);
  });
});
