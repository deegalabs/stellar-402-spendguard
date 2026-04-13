"use client";

/**
 * Global Toast system
 *
 * Context-based notification primitive. Mount <ToastProvider> once near
 * the root (see app/layout.tsx) and call useToast() from any client
 * component to surface transient status updates.
 *
 * Design goals:
 * - Theme-aware: reuses the success/error/warning/primary tokens that
 *   already ship with the app, so toasts match whatever palette the
 *   current theme sets.
 * - Non-blocking: fixed bottom-right (stacks upward), pointer-events
 *   scoped to the toast card so the underlying UI stays interactive.
 * - Accessible: role="alert" for errors (assertive), role="status" for
 *   everything else; the viewport is aria-live="polite".
 * - No new dependency surface: built on React state + the existing
 *   Tailwind animations (slide-up) and Material Symbols.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title: string;
  description?: string;
  /** ms before auto-dismiss. `0` keeps it open until dismissed manually. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: number;
  kind: ToastKind;
  description?: string;
}

export interface ToastAPI {
  show: (kind: ToastKind, opts: ToastOptions | string) => number;
  success: (opts: ToastOptions | string) => number;
  error: (opts: ToastOptions | string) => number;
  info: (opts: ToastOptions | string) => number;
  warning: (opts: ToastOptions | string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

const DEFAULT_DURATION = 4200;
const ERROR_DURATION = 6000;
const MAX_VISIBLE = 5;

// Module-scope id counter. Monotonic for the lifetime of the tab; collision
// would require ~2^53 notifications, which is fine.
let __nextToastId = 0;

function normalize(opts: ToastOptions | string): ToastOptions {
  return typeof opts === "string" ? { title: opts } : opts;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const clearTimer = useCallback((id: number) => {
    const handle = timers.current.get(id);
    if (handle !== undefined) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer]
  );

  const show = useCallback(
    (kind: ToastKind, opts: ToastOptions | string): number => {
      const normalized = normalize(opts);
      const id = ++__nextToastId;
      const duration =
        normalized.duration ??
        (kind === "error" ? ERROR_DURATION : DEFAULT_DURATION);

      const item: ToastItem = {
        id,
        kind,
        title: normalized.title,
        description: normalized.description,
        duration,
      };

      setToasts((prev) => {
        const next = [...prev, item];
        // FIFO eviction so the stack never grows unbounded.
        while (next.length > MAX_VISIBLE) {
          const dropped = next.shift();
          if (dropped) clearTimer(dropped.id);
        }
        return next;
      });

      if (duration > 0) {
        const handle = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, handle);
      }

      return id;
    },
    [clearTimer, dismiss]
  );

  const api = useMemo<ToastAPI>(
    () => ({
      show,
      success: (o) => show("success", o),
      error: (o) => show("error", o),
      info: (o) => show("info", o),
      warning: (o) => show("warning", o),
      dismiss,
    }),
    [show, dismiss]
  );

  // Tear down any outstanding timers if the provider unmounts.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((handle) => window.clearTimeout(handle));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Viewport
// ---------------------------------------------------------------------------

const KIND_STYLES: Record<
  ToastKind,
  {
    bg: string;
    border: string;
    fg: string;
    icon: string;
    role: "status" | "alert";
    ariaLive: "polite" | "assertive";
  }
> = {
  success: {
    bg: "bg-success-glow",
    border: "border-success/30",
    fg: "text-success-fg",
    icon: "check_circle",
    role: "status",
    ariaLive: "polite",
  },
  error: {
    bg: "bg-error-glow",
    border: "border-error/30",
    fg: "text-error-fg",
    icon: "error",
    role: "alert",
    ariaLive: "assertive",
  },
  info: {
    bg: "bg-primary-glow",
    border: "border-primary-400/30",
    fg: "text-primary-fg",
    icon: "info",
    role: "status",
    ariaLive: "polite",
  },
  warning: {
    bg: "bg-warning-glow",
    border: "border-warning/30",
    fg: "text-warning-fg",
    icon: "warning",
    role: "status",
    ariaLive: "polite",
  },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col-reverse gap-2 sm:max-w-sm"
    >
      {toasts.map((t) => {
        const s = KIND_STYLES[t.kind];
        return (
          <div
            key={t.id}
            role={s.role}
            aria-live={s.ariaLive}
            className={`pointer-events-auto animate-slide-up backdrop-blur-xl border ${s.bg} ${s.border} rounded-xl p-3 pr-2 shadow-panel flex items-start gap-3`}
          >
            <span
              translate="no"
              aria-hidden="true"
              className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${s.fg}`}
            >
              {s.icon}
            </span>
            <div className={`flex-1 min-w-0 text-sm ${s.fg}`}>
              <div className="font-semibold leading-tight break-words">
                {t.title}
              </div>
              {t.description && (
                <div className="mt-0.5 text-xs opacity-85 leading-snug break-words">
                  {t.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className={`shrink-0 rounded-lg p-1 hover:bg-white/10 transition-colors ${s.fg}`}
              aria-label="Dismiss notification"
            >
              <span
                translate="no"
                aria-hidden="true"
                className="material-symbols-outlined text-[16px]"
              >
                close
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
