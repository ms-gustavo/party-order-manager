import type { ToastMessage } from "../hooks/useToast";

export default function Toast({ toast }: { toast: ToastMessage | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed left-0 right-0 top-0 z-50">
      {toast && (
        <div
          key={toast.key}
          data-testid="toast"
          className="absolute left-1/2 top-[max(16px,env(safe-area-inset-top))] -translate-x-1/2 animate-toast-in whitespace-nowrap rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-surface shadow-lg"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
