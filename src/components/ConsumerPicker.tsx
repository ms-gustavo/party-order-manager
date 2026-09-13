import type { Person } from "../types";
import Avatar from "./Avatar";

interface ConsumerPickerProps {
  /** Só quem ainda está na mesa. */
  people: Person[];
  value: string[];
  onSelectAll: () => void;
  onToggle: (personId: string) => void;
}

export default function ConsumerPicker({ people, value, onSelectAll, onToggle }: ConsumerPickerProps) {
  const all = people.every((p) => value.includes(p.id));
  const chip =
    "flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 text-[13px] font-semibold transition";

  return (
    <div role="group" aria-label="Quem consumiu" className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={onSelectAll}
        aria-pressed={all}
        data-testid="consumer-all"
        className={`${chip} px-3 ${all ? "" : "opacity-50"}`}
      >
        Todos
      </button>
      {people.map((person) => {
        const selected = all || value.includes(person.id);
        return (
          <button
            type="button"
            key={person.id}
            onClick={() => onToggle(person.id)}
            aria-pressed={selected}
            data-testid="consumer-option"
            className={`${chip} pl-1 pr-2.5 ${selected ? "" : "opacity-50 grayscale"}`}
          >
            <Avatar person={person} size="sm" />
            {person.name}
          </button>
        );
      })}
    </div>
  );
}
