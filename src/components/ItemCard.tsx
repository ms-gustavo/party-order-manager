import { useRef, useState, type PointerEvent } from "react";
import type { Item, Person } from "../types";
import { activePeople, isItemLocked, isSharedByAll, itemConsumers, paidConsumers } from "../lib/bill";
import { formatBRL } from "../lib/money";
import Avatar from "./Avatar";
import ConsumerPicker from "./ConsumerPicker";
import Stepper from "./Stepper";

const REVEAL = 96;

interface ItemCardProps {
  item: Item;
  people: Person[];
  swiped: boolean;
  onSwipedChange: (swiped: boolean) => void;
  onQuantityChange: (delta: number) => void;
  onSelectAll: () => void;
  onToggleConsumer: (personId: string) => void;
  onRemove: () => void;
  /** Item travado: cria um pedido novo só com quem ficou. */
  onOrderAgain: () => void;
}

const names = (people: Person[]) => people.map((p) => p.name).join(", ");

export default function ItemCard({
  item,
  people,
  swiped,
  onSwipedChange,
  onQuantityChange,
  onSelectAll,
  onToggleConsumer,
  onRemove,
  onOrderAgain,
}: ItemCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    base: number;
    offset: number;
    horizontal: boolean | null;
  } | null>(null);

  const consumers = itemConsumers(item, people);
  const locked = isItemLocked(item, people);
  const label = isSharedByAll(item, people) ? "Todos" : names(consumers);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (locked || (e.target as HTMLElement).closest("button, input")) return;
    const base = swiped ? -REVEAL : 0;
    gesture.current = { x: e.clientX, y: e.clientY, base, offset: base, horizontal: null };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.horizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!g.horizontal) return (gesture.current = null);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Sem captura o gesto continua funcionando, só perde o dedo se sair do card
      }
    }
    g.offset = Math.min(0, Math.max(-REVEAL - 24, g.base + dx));
    setDragX(g.offset);
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (g.horizontal) {
      onSwipedChange(g.offset < -REVEAL / 2);
    } else if (swiped) {
      onSwipedChange(false); // toque no card aberto fecha
    }
    setDragX(null);
  };

  const offset = locked ? 0 : dragX ?? (swiped ? -REVEAL : 0);

  return (
    <li data-testid="item-card" data-locked={locked} className="relative list-none">
      {!locked && (
        <button
          onClick={onRemove}
          tabIndex={-1}
          aria-hidden={!swiped}
          className="absolute inset-px flex flex-col items-end justify-center gap-0.5 rounded-[15px] bg-danger pr-5 text-[13px] font-bold text-white"
          style={{ visibility: offset < 0 ? "visible" : "hidden" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
          </svg>
          Remover
        </button>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative touch-pan-y select-none rounded-2xl border pb-2.5 pl-3.5 pr-3 pt-3 ${
          locked ? "border-dashed border-line bg-surface/60" : "border-line bg-surface"
        } ${dragX === null ? "transition-transform duration-200" : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <p data-testid="item-name" className="flex items-center gap-1.5 text-[15.5px] font-semibold">
              {locked && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-label="Travado" className="flex-none text-muted">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              )}
              {item.name}
            </p>
            <p className="font-mono text-[12.5px] text-muted">{formatBRL(item.unitPrice)} cada</p>
          </div>
          <p data-testid="item-total" className="whitespace-nowrap text-right font-mono text-[15px] font-semibold tabular-nums">
            {formatBRL(item.unitPrice * item.quantity)}
          </p>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            data-testid="consumers-toggle"
            className={`flex min-w-0 items-center gap-1.5 rounded-full py-[5px] pl-1.5 pr-2.5 text-[13px] font-semibold ${
              locked ? "bg-surface-2 text-muted" : "bg-pen-soft text-pen"
            }`}
          >
            <span className="flex">
              {consumers.slice(0, 4).map((p, i) => (
                <Avatar
                  key={p.id}
                  person={p}
                  size="xs"
                  className={`border-2 ${locked ? "border-surface-2" : "border-pen-soft"} ${i ? "-ml-1.5" : ""} ${p.paid ? "grayscale" : ""}`}
                />
              ))}
            </span>
            <span className="max-w-[130px] truncate">{label}</span>
          </button>

          <Stepper
            onDecrement={() => onQuantityChange(-1)}
            onIncrement={() => (locked ? onOrderAgain() : onQuantityChange(1))}
            decrementLabel={`Diminuir ${item.name}`}
            incrementLabel={locked ? `Pedir mais ${item.name}` : `Aumentar ${item.name}`}
            testId="qty"
          >
            <output data-testid="item-quantity" className="min-w-[28px] text-center font-mono font-semibold">
              {item.quantity}
            </output>
          </Stepper>
        </div>

        {pickerOpen && (
          <div className="mt-2.5 flex flex-col gap-2.5 border-t border-dashed border-line pt-2.5">
            {locked ? (
              <p data-testid="item-locked-note" className="text-[13px] text-muted">
                Travado porque {names(paidConsumers(item, people))} já pagou. Pediram mais? Toque no
                + pra lançar um pedido novo só com quem ficou.
              </p>
            ) : (
              <>
                <ConsumerPicker
                  people={activePeople(people)}
                  value={item.consumerIds}
                  onSelectAll={onSelectAll}
                  onToggle={onToggleConsumer}
                />
                <button
                  onClick={onRemove}
                  data-testid="item-remove"
                  className="self-start text-[13px] font-semibold text-danger hover:underline"
                >
                  Remover item
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
