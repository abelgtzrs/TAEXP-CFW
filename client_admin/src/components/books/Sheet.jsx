import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
// eslint-disable-next-line no-unused-vars -- used as <motion.div>, which this lint config doesn't count
import { AnimatePresence, MotionConfig, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";

const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

// Bottom sheet on phones (drag the top bar down to close), centered dialog from `sm` up.
export default function Sheet({ open, onClose, title, children }) {
  const panelRef = useRef(null);
  const dragControls = useDragControls();
  const phone = isPhone();
  // Ref so a new onClose each render doesn't re-run the effect and steal focus from inputs.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-6">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              className="relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-white/10 bg-surface shadow-2xl outline-none sm:max-w-md sm:rounded-2xl"
              initial={phone ? { y: "100%" } : { opacity: 0, y: 12, scale: 0.98 }}
              animate={phone ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={phone ? { y: "100%" } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", damping: 34, stiffness: 380 }}
              drag={phone ? "y" : false}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 110 || info.velocity.y > 600) onClose();
              }}
            >
              <div
                className="touch-none select-none px-5 pt-2.5 pb-2 sm:pt-4"
                onPointerDown={(e) => phone && dragControls.start(e)}
              >
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden="true" />
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-sm font-semibold text-text-main">{title}</h2>
                  <button type="button" onClick={onClose} className="dash-btn dash-btn-icon !h-9 !w-9" aria-label="Close">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
