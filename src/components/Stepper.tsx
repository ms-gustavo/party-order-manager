import type { ReactNode } from "react";

interface StepperProps {
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
  children: ReactNode;
  testId?: string;
}

export default function Stepper({
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  children,
  testId,
}: StepperProps) {
  const button =
    "grid h-8 w-[34px] place-items-center text-lg font-semibold transition hover:bg-surface-2 active:bg-line";
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-line bg-surface">
      <button
        type="button"
        className={button}
        onClick={onDecrement}
        aria-label={decrementLabel}
        data-testid={testId && `${testId}-minus`}
      >
        −
      </button>
      {children}
      <button
        type="button"
        className={button}
        onClick={onIncrement}
        aria-label={incrementLabel}
        data-testid={testId && `${testId}-plus`}
      >
        +
      </button>
    </div>
  );
}
