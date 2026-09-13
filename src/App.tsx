import { useMemo, useState } from "react";
import { computeBill, toggleConsumer } from "./lib/bill";
import { buildShareText } from "./lib/share";
import { useBill } from "./state/useBill";
import AddItemSheet from "./components/AddItemSheet";
import AppHeader from "./components/AppHeader";
import BillFooter from "./components/BillFooter";
import ItemCard from "./components/ItemCard";
import PeopleBar from "./components/PeopleBar";
import Receipt from "./components/Receipt";
import ShareSheet from "./components/ShareSheet";
import Sheet from "./components/Sheet";
import TipControl from "./components/TipControl";
import Toast from "./components/Toast";
import { useToast } from "./hooks/useToast";

type OpenSheet = "add" | "share" | "reset" | null;

export default function App() {
  const [state, dispatch] = useBill();
  const [toast, notify] = useToast();
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const bill = useMemo(() => computeBill(state), [state]);
  const closeSheet = () => setSheet(null);
  const { people, items } = state;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

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
          onAdd={(name) => dispatch({ type: "addPerson", name })}
          onRemove={(id) => dispatch({ type: "removePerson", id })}
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
                    if (item.quantity + delta < 1) {
                      return notify("Pra tirar o item, arraste pro lado");
                    }
                    dispatch({ type: "changeQuantity", id: item.id, delta });
                  }}
                  onSelectAll={() => dispatch({ type: "setConsumers", id: item.id, consumerIds: null })}
                  onToggleConsumer={(personId) => {
                    const next = toggleConsumer(item.consumerIds, personId, people.map((p) => p.id));
                    if (next === undefined) return notify("Alguém tem que ter consumido");
                    dispatch({ type: "setConsumers", id: item.id, consumerIds: next });
                  }}
                  onRemove={() => {
                    dispatch({ type: "removeItem", id: item.id });
                    notify(`${item.name} removido`);
                  }}
                />
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <p className="text-center text-xs text-muted">← arraste um item pra remover</p>
          )}

          <button
            onClick={() => setSheet("add")}
            disabled={people.length === 0}
            data-testid="add-item-button"
            className="rounded-2xl border-[1.5px] border-dashed border-line p-3.5 text-[15px] font-bold text-pen transition hover:bg-surface disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
          >
            + Adicionar item
          </button>
        </section>

        {people.length > 0 && <Receipt bill={bill} tipPercent={state.tipPercent} />}
      </main>

      <BillFooter total={bill.total} tipPercent={state.tipPercent} onShare={() => setSheet("share")} />

      <AddItemSheet
        open={sheet === "add"}
        people={people}
        onClose={closeSheet}
        onAdd={(item) => {
          dispatch({ type: "addItem", item });
          closeSheet();
          notify("Item adicionado");
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
