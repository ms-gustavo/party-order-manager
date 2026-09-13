import { describe, expect, it } from "vitest";
import { billReducer, initialState } from "./reducer";
import { parseState } from "./storage";

const withPeople = () => {
  let s = billReducer(initialState, { type: "addPerson", name: "Gustavo" });
  s = billReducer(s, { type: "addPerson", name: "Ana" });
  return s;
};

describe("billReducer", () => {
  it("não altera o estado anterior", () => {
    const before = withPeople();
    const snapshot = JSON.stringify(before);
    billReducer(before, {
      type: "addItem",
      item: { name: "Chopp", unitPrice: 1400, quantity: 1, consumerIds: null },
    });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("dá cores diferentes pra cada pessoa e ignora nome vazio", () => {
    const s = billReducer(withPeople(), { type: "addPerson", name: "   " });
    expect(s.people).toHaveLength(2);
    expect(s.people[0].color).not.toBe(s.people[1].color);
  });

  it("rejeita item sem nome ou sem preço", () => {
    const s = withPeople();
    const base = { quantity: 1, consumerIds: null };
    expect(billReducer(s, { type: "addItem", item: { ...base, name: "", unitPrice: 100 } })).toBe(s);
    expect(billReducer(s, { type: "addItem", item: { ...base, name: "Água", unitPrice: 0 } })).toBe(s);
  });

  it("não deixa a quantidade ficar abaixo de 1", () => {
    let s = billReducer(withPeople(), {
      type: "addItem",
      item: { name: "Chopp", unitPrice: 1400, quantity: 1, consumerIds: null },
    });
    s = billReducer(s, { type: "changeQuantity", id: s.items[0].id, delta: -1 });
    expect(s.items[0].quantity).toBe(1);
  });

  it("ao remover a única pessoa de um item, ele passa a ser de todos", () => {
    let s = withPeople();
    const ana = s.people[1];
    s = billReducer(s, {
      type: "addItem",
      item: { name: "Caipirinha", unitPrice: 2200, quantity: 1, consumerIds: [ana.id] },
    });
    s = billReducer(s, { type: "removePerson", id: ana.id });
    expect(s.items[0].consumerIds).toBeNull();
  });
});

describe("parseState", () => {
  it("recusa formatos desconhecidos", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState({ sharedOrders: [] })).toBeNull();
  });

  it("descarta itens inválidos e referências a pessoas que não existem", () => {
    const parsed = parseState({
      tableName: "Bar",
      tipPercent: 10,
      people: [{ id: "a", name: "Ana", color: "#000" }],
      items: [
        { id: "1", name: "Ok", unitPrice: 100, quantity: 1, consumerIds: ["a", "sumiu"] },
        { id: "2", name: "Quebrado", unitPrice: -5, quantity: 1, consumerIds: null },
      ],
    });
    expect(parsed?.items).toHaveLength(1);
    expect(parsed?.items[0].consumerIds).toEqual(["a"]);
  });
});
