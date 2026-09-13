import { describe, expect, it } from "vitest";
import type { BillState } from "../types";
import { computeBill } from "../lib/bill";
import { billReducer, initialState, type Action } from "./reducer";
import { parseState } from "./storage";

const run = (state: BillState, ...actions: Action[]) => actions.reduce(billReducer, state);

const withPeople = (...names: string[]) =>
  run(initialState, ...names.map((name): Action => ({ type: "addPerson", name })));

const ids = (s: BillState) => s.people.map((p) => p.id);

const addItem = (s: BillState, name: string, unitPrice: number, consumerIds = ids(s)) =>
  billReducer(s, { type: "addItem", item: { name, unitPrice, quantity: 1, consumerIds } });

describe("billReducer", () => {
  it("não altera o estado anterior", () => {
    const before = withPeople("Gustavo", "Ana");
    const snapshot = JSON.stringify(before);
    addItem(before, "Chopp", 1400);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("dá cores diferentes pra cada pessoa e ignora nome vazio", () => {
    const s = billReducer(withPeople("Gustavo", "Ana"), { type: "addPerson", name: "   " });
    expect(s.people).toHaveLength(2);
    expect(s.people[0].color).not.toBe(s.people[1].color);
  });

  it("rejeita item sem nome, sem preço ou sem ninguém", () => {
    const s = withPeople("Gustavo", "Ana");
    expect(addItem(s, "", 100)).toBe(s);
    expect(addItem(s, "Água", 0)).toBe(s);
    expect(addItem(s, "Água", 600, [])).toBe(s);
  });

  it("não deixa a quantidade ficar abaixo de 1", () => {
    let s = addItem(withPeople("Gustavo"), "Chopp", 1400);
    s = billReducer(s, { type: "changeQuantity", id: s.items[0].id, delta: -1 });
    expect(s.items[0].quantity).toBe(1);
  });

  it("ao remover a única pessoa de um item, ele passa pra quem ficou", () => {
    let s = withPeople("Gustavo", "Ana", "Léo");
    const [, ana] = s.people;
    s = addItem(s, "Caipirinha", 2200, [ana.id]);
    s = billReducer(s, { type: "removePerson", id: ana.id });
    expect(s.items[0].consumerIds).toEqual(ids(s));
  });

  it("quem chega depois não paga o que foi pedido antes", () => {
    let s = addItem(withPeople("Gustavo", "Ana"), "Batata", 3000);
    s = billReducer(s, { type: "addPerson", name: "Bia" });
    const bill = computeBill(s);
    expect(bill.rows.map((r) => r.total)).toEqual([1650, 1650, 0]);
  });
});

describe("fechar a conta de alguém", () => {
  const setup = () => {
    let s = withPeople("Gustavo", "Ana", "Léo");
    s = addItem(s, "Batata", 3000); // todos
    const ana = s.people[1];
    s = billReducer(s, { type: "settlePerson", id: ana.id, at: 123, amount: 1100 });
    return { s, ana, batata: s.items[0] };
  };

  it("congela o valor pago, com taxa", () => {
    const { s, ana } = setup();
    expect(s.people[1].paid).toEqual({ consumption: 1000, tip: 100, amount: 1100, at: 123 });
    expect(computeBill(s)).toMatchObject({ total: 3300, paid: 1100, remaining: 2200 });
    expect(ana.paid).toBeNull(); // referência antiga intacta
  });

  it("não cobra de novo quem ficou quando alguém paga e sai", () => {
    const { s } = setup();
    const bill = computeBill(s);
    expect(bill.rows.map((r) => r.total)).toEqual([1100, 1100, 1100]);
  });

  it("trava os itens que a pessoa dividiu", () => {
    const { s, batata } = setup();
    expect(billReducer(s, { type: "changeQuantity", id: batata.id, delta: 1 })).toBe(s);
    expect(billReducer(s, { type: "removeItem", id: batata.id })).toBe(s);
    expect(billReducer(s, { type: "setConsumers", id: batata.id, consumerIds: [s.people[0].id] })).toBe(s);
  });

  it("não deixa remover quem pagou nem quem divide item com ela", () => {
    const { s } = setup();
    expect(billReducer(s, { type: "removePerson", id: s.people[1].id })).toBe(s);
    expect(billReducer(s, { type: "removePerson", id: s.people[0].id })).toBe(s);
  });

  it("itens novos não incluem quem já foi embora", () => {
    const { s } = setup();
    const next = addItem(s, "Chopp", 1400, ids(s));
    expect(next.items[1].consumerIds).toEqual([s.people[0].id, s.people[2].id]);
    expect(computeBill(next).rows[1].total).toBe(1100);
  });

  it("mudar a taxa depois não mexe em quem já pagou", () => {
    const { s } = setup();
    const next = billReducer(s, { type: "setTip", percent: 0 });
    expect(computeBill(next).rows.map((r) => r.total)).toEqual([1000, 1100, 1000]);
  });

  it("desfazer o pagamento destrava os itens", () => {
    const { s, batata } = setup();
    let next = billReducer(s, { type: "undoSettlement", id: s.people[1].id });
    next = billReducer(next, { type: "changeQuantity", id: batata.id, delta: 1 });
    expect(next.items[0].quantity).toBe(2);
  });

  it("não fecha a conta duas vezes", () => {
    const { s } = setup();
    expect(billReducer(s, { type: "settlePerson", id: s.people[1].id, at: 999, amount: 1100 })).toBe(s);
  });

  it("aceita valor pago diferente e permite corrigir depois", () => {
    const { s } = setup();
    const ana = s.people[1].id;
    let next = billReducer(s, { type: "updatePayment", id: ana, amount: 2200 });
    expect(computeBill(next).rows.map((r) => r.total)).toEqual([550, 2200, 550]);
    next = billReducer(next, { type: "updatePayment", id: ana, amount: -1 });
    expect(next.people[1].paid?.amount).toBe(2200);
  });

  it("não fecha a conta com valor inválido", () => {
    const s = addItem(withPeople("Gustavo"), "Batata", 1000);
    expect(billReducer(s, { type: "settlePerson", id: s.people[0].id, at: 1, amount: 10.5 })).toBe(s);
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
    expect(parsed?.people[0].paid).toBeNull();
  });

  it("converte o 'todos' antigo (null) na lista de pessoas", () => {
    const parsed = parseState({
      tableName: "",
      tipPercent: 10,
      people: [
        { id: "a", name: "Ana", color: "#000" },
        { id: "g", name: "Gustavo", color: "#111", paid: { consumption: 500, tip: 50, amount: 600, at: 1 } },
      ],
      items: [{ id: "1", name: "Batata", unitPrice: 100, quantity: 1, consumerIds: null }],
    });
    expect(parsed?.items[0].consumerIds).toEqual(["a", "g"]);
    expect(parsed?.people[1].paid).toEqual({ consumption: 500, tip: 50, amount: 600, at: 1 });
  });
});
