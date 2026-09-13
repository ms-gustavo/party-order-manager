interface AppHeaderProps {
  tableName: string;
  onTableNameChange: (name: string) => void;
  onNewBill: () => void;
}

export default function AppHeader({ tableName, onTableNameChange, onNewBill }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-[18px] pb-3 pt-[max(18px,env(safe-area-inset-top))]">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[26px] leading-none tracking-[0.01em]">Comanda</h1>
        <input
          value={tableName}
          onChange={(e) => onTableNameChange(e.target.value)}
          placeholder="Onde é o rolê?"
          aria-label="Nome da mesa ou do lugar"
          maxLength={40}
          data-testid="table-name-input"
          className="mt-1 w-full rounded bg-transparent text-[13px] font-medium text-muted placeholder:text-muted/60 focus:text-ink focus:outline-none"
        />
      </div>
      <button
        onClick={onNewBill}
        data-testid="reset-button"
        className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-[13px] font-semibold transition hover:bg-surface-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Nova
      </button>
    </header>
  );
}
