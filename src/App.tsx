import { useMemo, useState } from "react";
import { activePeople, computeBill, isItemLocked, sharesLockedItem, toggleConsumer } from "./lib/bill";
import { formatBRL } from "./lib/money";
import { buildShareText } from "./lib/share";
import { useBill } from "./state/useBill";
import AddItemSheet, { type ItemDraft } from "./components/AddItemSheet";
import AppHeader from "./components/AppHeader";
import BillFooter from "./components/BillFooter";
import ItemCard from "./components/ItemCard";
import PeopleBar from "./components/PeopleBar";
import PersonSheet from "./components/PersonSheet";
import Receipt from "./components/Receipt";
import ShareSheet from "./components/ShareSheet";
import Sheet from "./components/Sheet";
import TipControl from "./components/TipControl";
import Toast from "./components/Toast";
import { useToast } from "./hooks/useToast";

type OpenSheet = "add" | "share" | "reset" | { personId: string } | null;

export default function App() {
  const [state, dispatch] = useBill();
  const [toast, notify] = useToast();
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const bill = useMemo(() => computeBill(state), [state]);
  const closeSheet = () => setSheet(null);
  const { people, items } = state;
  const active = activePeople(people);
  const activeIds = active.map((p) => p.id);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // O × rápido só aparece pra quem ainda não tem nada na conta
  const removableIds = new Set(
    bill.rows.filter((r) => !r.person.paid && r.consumption === 0).map((r) => r.person.id)
  );

  const personId = typeof sheet === "object" && sheet ? sheet.personId : null;
  const personRow = bill.rows.find((r) => r.person.id === personId) ?? null;

  const openAddItem = (next: ItemDraft | null = null) => {
    setDraft(next);
    setSheet("add");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <AppHeader
        tableName={state.tableName}
        onTableNameChange={(name) => dispatch({ type: "setTableName", name })}
        onNewBill={() => setSheet("reset")}
      />

      <main className="flex flex-col gap-3.5 px-3.5 pb-32">
        <PeopleBar
          people={people}
          removableIds={removableIds}
          onAdd={(name) => dispatch({ type: "addPerson", name })}
          onRemove={(id) => dispatch({ type: "removePerson", id })}
          onSelect={(id) => setSheet({ personId: id })}
        />

        <TipControl
          percent={state.tipPercent}
          onChange={(percent) => dispatch({ type: "setTip", percent })}
        />

        <section aria-labelledby="items-label" className="flex flex-col gap-2">
          <div className="section-label">
            <span id="items-label">Pedidos</span>
            <span data-testid="items-count">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </span>
          </div>

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              {people.length === 0
                ? "Primeiro coloca a galera na mesa, aí é só pedir."
                : "Nenhum pedido ainda. Bora pedir uma gelada?"}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  people={people}
                  swiped={swipedId === item.id}
                  onSwipedChange={(swiped) => setSwipedId(swiped ? item.id : null)}
                  onQuantityChange={(delta) => {
                    if (isItemLocked(item, people)) {
                      return notify("Item travado: alguém que dividiu já pagou");
                    }
                    if (item.quantity + delta < 1) {
                      return notify("Pra tirar o item, arraste pro lado");
                    }
                    dispatch({ type: "changeQuantity", id: item.id, delta });
                  }}
                  onSelectAll={() => dispatch({ type: "setConsumers", id: item.id, consumerIds: activeIds })}
                  onToggleConsumer={(id) => {
                    const next = toggleConsumer(item.consumerIds, id, activeIds);
                    if (next === undefined) return notify("Alguém tem que ter consumido");
                    dispatch({ type: "setConsumers", id: item.id, consumerIds: next });
                  }}
                  onRemove={() => {
                    dispatch({ type: "removeItem", id: item.id });
                    notify(`${item.name} removido`);
                  }}
                  onOrderAgain={() => {
                    if (active.length === 0) return notify("Todo mundo já pagou");
                    openAddItem({ name: item.name, unitPrice: item.unitPrice, consumerIds: item.consumerIds });
                  }}
                />
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <p className="text-center text-xs text-muted">← arraste um item pra remover</p>
          )}

          <button
            onClick={() => openAddItem()}
            disabled={active.length === 0}
            data-testid="add-item-button"
            className="rounded-2xl border-[1.5px] border-dashed border-line p-3.5 text-[15px] font-bold text-pen transition hover:bg-surface disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
          >
            + Adicionar item
          </button>
        </section>

        {people.length > 0 && <Receipt bill={bill} tipPercent={state.tipPercent} />}
      </main>

      <BillFooter bill={bill} tipPercent={state.tipPercent} onShare={() => setSheet("share")} />

      <AddItemSheet
        open={sheet === "add"}
        people={active}
        draft={draft}
        onClose={closeSheet}
        onAdd={(item) => {
          dispatch({ type: "addItem", item });
          closeSheet();
          notify("Item adicionado");
        }}
      />

      <PersonSheet
        row={personRow}
        tipPercent={state.tipPercent}
        othersAtTable={active.some((p) => p.id !== personId)}
        removalBlocked={!!personId && sharesLockedItem(personId, state)}
        onClose={closeSheet}
        onSettle={(person, amount) => {
          dispatch({ type: "settlePerson", id: person.id, at: Date.now(), amount });
          closeSheet();
          notify(`Conta de ${person.name} fechada: ${formatBRL(amount)}`);
        }}
        onUpdatePayment={(person, amount) => {
          dispatch({ type: "updatePayment", id: person.id, amount });
          closeSheet();
          notify(`Pagamento de ${person.name} corrigido: ${formatBRL(amount)}`);
        }}
        onUndo={(person) => {
          dispatch({ type: "undoSettlement", id: person.id });
          closeSheet();
          notify(`Pagamento de ${person.name} desfeito`);
        }}
        onRemove={(person) => {
          dispatch({ type: "removePerson", id: person.id });
          closeSheet();
          notify(`${person.name} saiu da mesa`);
        }}
      />

      <ShareSheet
        open={sheet === "share"}
        text={sheet === "share" ? buildShareText(state) : ""}
        onClose={closeSheet}
        notify={notify}
      />

      <Sheet open={sheet === "reset"} title="Começar uma comanda nova?" onClose={closeSheet} testId="reset-sheet">
        <p className="text-muted">
          Os itens e as pessoas desta mesa vão ser apagados. Não dá pra desfazer.
        </p>
        <button
          onClick={() => {
            dispatch({ type: "reset" });
            setSwipedId(null);
            closeSheet();
            notify("Comanda nova aberta");
          }}
          data-testid="reset-confirm"
          className="btn-danger"
        >
          Apagar e começar do zero
        </button>
        <button onClick={closeSheet} data-testid="reset-cancel" className="btn-ghost">
          Voltar
        </button>
      </Sheet>

      <Toast toast={toast} />
    </div>
  );
}
