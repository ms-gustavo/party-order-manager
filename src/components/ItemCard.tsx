import { useRef, useState, type PointerEvent } from "react";
import type { Item, Person } from "../types";
import { isSharedByAll, itemConsumers } from "../lib/bill";
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
}

export default function ItemCard({
  item,
  people,
  swiped,
  onSwipedChange,
  onQuantityChange,
  onSelectAll,
  onToggleConsumer,
  onRemove,
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
  const all = isSharedByAll(item, people);
  const label = all ? "Todos" : consumers.map((p) => p.name).join(", ");

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, input")) return;
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

  const offset = dragX ?? (swiped ? -REVEAL : 0);

  return (
    <li data-testid="item-card" className="relative list-none">
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

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative touch-pan-y select-none rounded-2xl border border-line bg-surface pb-2.5 pl-3.5 pr-3 pt-3 ${
          dragX === null ? "transition-transform duration-200" : ""
        }`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <p data-testid="item-name" className="text-[15.5px] font-semibold">{item.name}</p>
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
            className="flex min-w-0 items-center gap-1.5 rounded-full bg-pen-soft py-[5px] pl-1.5 pr-2.5 text-[13px] font-semibold text-pen"
          >
            <span className="flex">
              {consumers.slice(0, 4).map((p, i) => (
                <Avatar key={p.id} person={p} size="xs" className={`border-2 border-pen-soft ${i ? "-ml-1.5" : ""}`} />
              ))}
            </span>
            <span className="max-w-[130px] truncate">{label}</span>
          </button>

          <Stepper
            onDecrement={() => onQuantityChange(-1)}
            onIncrement={() => onQuantityChange(1)}
            decrementLabel={`Diminuir ${item.name}`}
            incrementLabel={`Aumentar ${item.name}`}
            testId="qty"
          >
            <output data-testid="item-quantity" className="min-w-[28px] text-center font-mono font-semibold">
              {item.quantity}
            </output>
          </Stepper>
        </div>

        {pickerOpen && (
          <div className="mt-2.5 flex flex-col gap-2.5 border-t border-dashed border-line pt-2.5">
            <ConsumerPicker
              people={people}
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
          </div>
        )}
      </div>
    </li>
  );
}
