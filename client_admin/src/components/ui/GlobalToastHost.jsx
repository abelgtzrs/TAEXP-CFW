import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function GlobalToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now() + Math.random();
      const detail = e?.detail || {};
      setToasts((prev) => [...prev, { id, fading: false, ...detail }]);
      // Schedule fade and removal
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, fading: true } : t)));
      }, 2800);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3400);
    };
    window.addEventListener("tae:toast", handler);
    return () => window.removeEventListener("tae:toast", handler);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      className="fixed z-[70] flex flex-col gap-2 pointer-events-none"
      style={{
        top: 52,
        right: "var(--right-sidebar-width)",
        maxWidth: 260,
      }}
    >
      {toasts.map((t) => {
        const hasImg = !!t.imageUrl;
        return (
          <div
            key={t.id}
            className={`toast-pop ${
              t.fading ? "toast-fading" : ""
            } toast-glow relative px-3 py-2 rounded-md border shadow-xl backdrop-blur-md bg-surface/90 border-primary/40 text-text-main text-xs font-semibold flex items-center gap-2 tracking-wide`}
            style={{ boxShadow: "0 4px 14px -2px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            <div className="toast-accent w-1 h-6 rounded-full" />
            {hasImg && (
              <div className="w-7 h-7 rounded-sm overflow-hidden border border-white/20 bg-black/30 flex-none">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={t.imageUrl} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {t.title && <div className="text-white text-[11px] leading-tight">{t.title}</div>}
              {t.message && <div className="text-[10px] text-text-secondary leading-tight truncate">{t.message}</div>}
            </div>
            {t.tag && <span className="text-[9px] text-text-tertiary opacity-60 flex-none">{t.tag}</span>}
          </div>
        );
      })}
    </div>,
    document.body
  );
}
