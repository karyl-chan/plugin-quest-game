import { useToastStore } from "@karyl-chan/ui";

/**
 * Thin adapter over @karyl-chan/ui's pinia-backed toast store so the
 * existing call sites (`const { ok, error } = useToast()`) keep working.
 * The shared store only models `info` and `error`; `ok` maps onto
 * `info` — the visual cue is the difference between a transient
 * notification and an error.
 */
export type ToastKind = "ok" | "error" | "info";

export function useToast() {
  const store = useToastStore();
  return {
    toast: (msg: string, kind: ToastKind = "info") =>
      store.show(msg, kind === "error" ? "error" : "info"),
    ok: (msg: string) => store.show(msg, "info"),
    error: (msg: string) => store.show(msg, "error"),
  };
}
