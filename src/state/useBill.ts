import { useEffect, useReducer } from "react";
import { billReducer } from "./reducer";
import { loadState, saveState } from "./storage";

/**
 * Estado da comanda persistido no localStorage.
 * Carrega de forma síncrona na inicialização, então não existe um
 * primeiro render vazio que sobrescreva os dados salvos.
 */
export function useBill() {
  const [state, dispatch] = useReducer(billReducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return [state, dispatch] as const;
}
