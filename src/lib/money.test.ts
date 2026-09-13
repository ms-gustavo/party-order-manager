import { describe, expect, it } from "vitest";
import { formatBRL, formatPercent, parseBRL, parsePercent, roundUpOptions } from "./money";

describe("parseBRL", () => {
  it.each([
    ["14", 1400],
    ["14,5", 1450],
    ["14,50", 1450],
    ["14.50", 1450],
    ["R$ 32,00", 3200],
    ["1.234,56", 123456],
    ["1.500", 150000],
    ["0,10", 10],
  ])("%s → %i centavos", (input, cents) => {
    expect(parseBRL(input)).toBe(cents);
  });

  it.each(["", "abc", "1,2,3", ","])("rejeita %j", (input) => {
    expect(parseBRL(input)).toBeNull();
  });
});

describe("parsePercent", () => {
  it("aceita vírgula ou ponto", () => {
    expect(parsePercent("12,5")).toBe(12.5);
    expect(parsePercent("8")).toBe(8);
    expect(parsePercent("")).toBeNull();
  });
});

describe("formatação", () => {
  it("formata centavos como real", () => {
    expect(formatBRL(10193).replace(/\s/g, " ")).toBe("R$ 101,93");
  });

  it("usa vírgula na porcentagem", () => {
    expect(formatPercent(12.5)).toBe("12,5%");
  });
});

describe("roundUpOptions", () => {
  it("sugere valores redondos acima do devido, sem repetir", () => {
    expect(roundUpOptions(3190)).toEqual([3200, 3500, 4000]);
    expect(roundUpOptions(3000)).toEqual([3100, 3500, 4000]);
    expect(roundUpOptions(990)).toEqual([1000]);
  });
});
