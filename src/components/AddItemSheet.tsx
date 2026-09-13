import { useState, type FormEvent } from "react";
import type { Item, Person } from "../types";
import { toggleConsumer } from "../lib/bill";
import { parseBRL } from "../lib/money";
import ConsumerPicker from "./ConsumerPicker";
import Sheet from "./Sheet";
import Stepper from "./Stepper";

export type ItemDraft = Pick<Item, "name" | "unitPrice" | "consumerIds">;

interface AddItemSheetProps {
  open: boolean;
  /** Só quem ainda está na mesa. */
  people: Person[];
  /** Preenche o formulário, ex.: pedir de novo um item travado. */
  draft?: ItemDraft | null;
  onClose: () => void;
  onAdd: (item: Omit<Item, "id">) => void;
}

const priceToInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export default function AddItemSheet({ open, people, draft, onClose, onAdd }: AddItemSheetProps) {
  return (
    <Sheet open={open} title={draft ? "Pedir de novo" : "Novo item"} onClose={onClose} testId="add-item-sheet">
      {/* Montado só quando aberto, então o formulário sempre começa limpo */}
      <AddItemForm people={people} draft={draft} onAdd={onAdd} />
    </Sheet>
  );
}

function AddItemForm({ people, draft, onAdd }: Pick<AddItemSheetProps, "people" | "draft" | "onAdd">) {
  const allIds = people.map((p) => p.id);
  const [name, setName] = useState(draft?.name ?? "");
  const [price, setPrice] = useState(draft ? priceToInput(draft.unitPrice) : "");
  const [quantity, setQuantity] = useState(1);
  // "Todos" é gravado como quem está na mesa agora
  const [consumerIds, setConsumerIds] = useState<string[]>(() => {
    const fromDraft = draft?.consumerIds.filter((id) => allIds.includes(id)) ?? [];
    return fromDraft.length ? fromDraft : allIds;
  });
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const unitPrice = parseBRL(price);
    if (!name.trim()) return setError('Dá um nome pro item, tipo "Chopp" ou "Porção".');
    if (!unitPrice) return setError("Informe o preço de uma unidade, maior que R$ 0,00.");
    onAdd({ name, unitPrice, quantity, consumerIds });
  };

  const toggle = (personId: string) => {
    const next = toggleConsumer(consumerIds, personId, allIds);
    if (next !== undefined) setConsumerIds(next);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-item-name" className="text-[12.5px] font-semibold text-muted">
          O que pediram?
        </label>
        <input
          id="new-item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Porção de mandioca"
          autoComplete="off"
          maxLength={40}
          data-testid="new-item-name"
          className="field-input"
        />
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-item-price" className="text-[12.5px] font-semibold text-muted">
            Preço unitário
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted">R$</span>
            <input
              id="new-item-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              autoComplete="off"
              data-testid="new-item-price"
              className="field-input pl-11 font-mono"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-muted">Qtd.</span>
          <Stepper
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
            onIncrement={() => setQuantity((q) => q + 1)}
            decrementLabel="Menos uma unidade"
            incrementLabel="Mais uma unidade"
            testId="new-item-qty"
          >
            <output data-testid="new-item-quantity" className="min-w-[40px] text-center font-mono font-semibold">
              {quantity}
            </output>
          </Stepper>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-muted">Quem consumiu?</span>
        <ConsumerPicker
          people={people}
          value={consumerIds}
          onSelectAll={() => setConsumerIds(allIds)}
          onToggle={toggle}
        />
      </div>

      <p role="alert" data-testid="new-item-error" className="min-h-[18px] text-[13px] font-semibold text-danger">
        {error}
      </p>

      <button type="submit" data-testid="new-item-submit" className="btn-primary">
        Adicionar à comanda
      </button>
    </form>
  );
}
