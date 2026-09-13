import { useEffect, useState } from "react";
import { MAX_TIP, TIP_PRESETS } from "../lib/bill";
import { formatPercent, parsePercent } from "../lib/money";
import Stepper from "./Stepper";

interface TipControlProps {
  percent: number;
  onChange: (percent: number) => void;
}

const toInput = (percent: number) => String(percent).replace(".", ",");

export default function TipControl({ percent, onChange }: TipControlProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(toInput(percent));
  const [editing, setEditing] = useState(false);

  // Enquanto a pessoa digita, não sobrescreve o campo com o valor arredondado
  useEffect(() => {
    if (!editing) setDraft(toInput(percent));
  }, [percent, editing]);

  const off = percent === 0;

  return (
    <section className="rounded-2xl border border-line bg-surface px-3.5 py-3">
      <div className="flex items-center justify-between gap-2.5">
        <div>
          <p className="font-semibold">Taxa de serviço</p>
          <p className="text-[12.5px] text-muted">
            {off ? "Sem taxa nesta mesa" : "Aplicada no consumo de cada um"}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="tip-panel"
          data-testid="tip-toggle"
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-[7px] font-bold ${
            off ? "bg-surface-2 text-muted" : "bg-hi-soft text-hi-ink"
          }`}
        >
          {formatPercent(percent)}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div id="tip-panel" className="mt-3 flex flex-col gap-3 border-t border-dashed border-line pt-3">
          <div className="grid grid-cols-5 gap-1.5">
            {TIP_PRESETS.map((value) => {
              const active = value === percent;
              return (
                <button
                  key={value}
                  onClick={() => onChange(value)}
                  aria-pressed={active}
                  data-testid={`tip-preset-${value}`}
                  className={`rounded-[10px] border py-2 text-sm font-semibold transition ${
                    active ? "border-ink bg-ink text-surface" : "border-line bg-surface-2 hover:border-muted"
                  }`}
                >
                  {value}%
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[13.5px] text-muted">
            <label htmlFor="tip-input">Outro valor (até {MAX_TIP}%)</label>
            <Stepper
              onDecrement={() => onChange(percent - 1)}
              onIncrement={() => onChange(percent + 1)}
              decrementLabel="Diminuir taxa"
              incrementLabel="Aumentar taxa"
              testId="tip"
            >
              <input
                id="tip-input"
                inputMode="decimal"
                value={draft}
                onFocus={() => setEditing(true)}
                onBlur={() => setEditing(false)}
                onChange={(e) => {
                  setDraft(e.target.value);
                  const value = parsePercent(e.target.value);
                  if (value !== null) onChange(value);
                }}
                data-testid="tip-input"
                className="w-[52px] bg-transparent text-center font-mono font-semibold text-ink focus:outline-none"
              />
            </Stepper>
          </div>
        </div>
      )}
    </section>
  );
}
