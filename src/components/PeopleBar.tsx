import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Person } from "../types";
import Avatar from "./Avatar";

interface PeopleBarProps {
  people: Person[];
  /** Quem pode sair com um toque no ×: ainda não consumiu nada. */
  removableIds: Set<string>;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}

export default function PeopleBar({ people, removableIds, onAdd, onRemove, onSelect }: PeopleBarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const prevCount = useRef(people.length);

  const updateFade = useCallback(() => {
    const el = listRef.current;
    if (el) setHasMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    // Quem acabou de entrar aparece: rola a lista até o fim
    if (people.length > prevCount.current && listRef.current) {
      listRef.current.scrollLeft = listRef.current.scrollWidth;
    }
    prevCount.current = people.length;
    updateFade();
  }, [people.length, adding, updateFade]);

  useEffect(() => {
    window.addEventListener("resize", updateFade);
    return () => window.removeEventListener("resize", updateFade);
  }, [updateFade]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setAdding(false);
    onAdd(name);
    setName("");
    // Continua aberto: normalmente se cadastra a mesa toda de uma vez
    inputRef.current?.focus();
  };

  return (
    <section aria-labelledby="people-label" className="flex flex-col gap-2">
      <div className="section-label">
        <span id="people-label">Na mesa</span>
        <span data-testid="people-count">
          {people.length} {people.length === 1 ? "pessoa" : "pessoas"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div
          ref={listRef}
          onScroll={updateFade}
          className={`no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto px-0.5 pb-1 pt-0.5 ${hasMore ? "fade-right" : ""}`}
        >
          {people.length === 0 && (
            <span className="py-1.5 pl-1 text-sm text-muted">Quem tá na mesa?</span>
          )}
          {people.map((person) => {
            const removable = removableIds.has(person.id);
            return (
              <div
                key={person.id}
                data-testid="person-chip"
                data-paid={!!person.paid}
                className={`flex flex-none items-center rounded-full border text-sm font-semibold ${
                  person.paid ? "border-dashed border-line bg-transparent" : "border-line bg-surface"
                }`}
              >
                <button
                  onClick={() => onSelect(person.id)}
                  aria-label={person.paid ? `${person.name}, já pagou` : `${person.name}, ver conta`}
                  data-testid="person-open"
                  className={`flex items-center gap-2 rounded-full py-1 pl-1 ${removable ? "pr-1" : "pr-3"}`}
                >
                  <span className="relative">
                    <Avatar person={person} className={person.paid ? "opacity-40 grayscale" : ""} />
                    {person.paid && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-ground"
                      >
                        ✓
                      </span>
                    )}
                  </span>
                  <span className={person.paid ? "text-muted line-through decoration-danger/60" : ""}>
                    {person.name}
                  </span>
                </button>
                {removable && (
                  <button
                    onClick={() => onRemove(person.id)}
                    aria-label={`Remover ${person.name}`}
                    data-testid="person-remove"
                    className="mr-1.5 grid h-[22px] w-[22px] place-items-center rounded-full text-[15px] leading-none text-muted transition hover:bg-surface-2 hover:text-danger"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-none pb-0.5">
          {adding ? (
            <form onSubmit={submit} className="flex gap-1.5">
              <input
                ref={inputRef}
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => !name.trim() && setAdding(false)}
                onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
                placeholder="Nome"
                maxLength={20}
                aria-label="Nome da pessoa"
                data-testid="add-person-input"
                className="w-[110px] rounded-full border-[1.5px] border-pen bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none"
              />
              <button
                type="submit"
                data-testid="add-person-submit"
                className="rounded-full bg-pen px-3 py-1.5 text-sm font-bold text-pen-ink"
              >
                OK
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              data-testid="add-person-button"
              className="rounded-full border-[1.5px] border-dashed border-line px-3.5 py-1.5 text-sm font-semibold text-muted transition hover:border-pen hover:text-pen"
            >
              + Pessoa
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
