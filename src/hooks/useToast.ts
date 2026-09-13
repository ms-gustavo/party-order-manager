import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastMessage {
  message: string;
  key: number;
}

export type Notify = (message: string) => void;

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number>();

  const notify = useCallback<Notify>((message) => {
    window.clearTimeout(timer.current);
    setToast({ message, key: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return [toast, notify] as const;
}
