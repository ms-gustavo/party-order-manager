const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function formatPercent(percent: number): string {
  return `${String(percent).replace(".", ",")}%`;
}

/**
 * Converte o que a pessoa digitou em centavos.
 * Aceita "14", "14,50", "14.50", "1.234,56" e "R$ 14,00".
 * Retorna `null` quando não dá pra entender o valor.
 */
export function parseBRL(input: string): number | null {
  let s = input.replace(/[^\d.,]/g, "");
  if (!s) return null;

  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.500" é mil e quinhentos, não um e meio
    s = s.replace(/\./g, "");
  }

  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** Converte "12,5" ou "12.5" em número; `null` se inválido. */
export function parsePercent(input: string): number | null {
  const s = input.replace(",", ".").replace(/[^\d.]/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** Próximos valores "redondos" acima de um valor: R$ 31,90 → 32, 35, 40. */
export function roundUpOptions(cents: number): number[] {
  const next = (step: number) => (Math.floor(cents / step) + 1) * step;
  return [...new Set([next(100), next(500), next(1000)])];
}
