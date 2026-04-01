import { useEffect, useMemo, useRef, useState } from "react";
import Widget from "../ui/Widget";

const AcquisitionImageThumb = ({ item, itemKey, serverBaseUrl, widgetBoundaryRef }) => {
  const clientBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [fallbackIdx, setFallbackIdx] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef(null);
  const popoverPanelRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const pointerClientYRef = useRef(null);
  const [popoverLayout, setPopoverLayout] = useState({
    left: 0,
    top: null,
    maxWidth: null,
    imageMaxHeight: 250,
  });

  const appBasePath = import.meta.env.BASE_URL || "/";
  const defaultImage = `${appBasePath.replace(/\/$/, "") || ""}/logo192.png`;
  const finalSvgFallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="#111827"/><rect x="12" y="12" width="136" height="136" rx="12" fill="#1f2937" stroke="#374151"/><circle cx="80" cy="68" r="20" fill="#334155"/><rect x="40" y="102" width="80" height="16" rx="8" fill="#334155"/></svg>',
    );

  const getImageCandidates = (value) => {
    if (!value) {
      return [defaultImage, `${clientBaseUrl}${defaultImage}`, `${serverBaseUrl}${defaultImage}`, finalSvgFallback];
    }

    if (value.startsWith("http")) {
      return [
        value,
        defaultImage,
        `${clientBaseUrl}${defaultImage}`,
        `${serverBaseUrl}${defaultImage}`,
        finalSvgFallback,
      ];
    }

    const clean = value.replace(/^\/?public\//, "");
    const normalizedPath = clean.startsWith("/") ? clean : `/${clean}`;

    return [
      normalizedPath,
      `${clientBaseUrl}${normalizedPath}`,
      `${serverBaseUrl}${normalizedPath}`,
      `${clientBaseUrl}/${clean}`,
      `${serverBaseUrl}/${clean}`,
      defaultImage,
      `${clientBaseUrl}${defaultImage}`,
      `${serverBaseUrl}${defaultImage}`,
      finalSvgFallback,
    ];
  };

  const candidates = useMemo(() => getImageCandidates(item?.imageUrl), [item?.imageUrl, clientBaseUrl, serverBaseUrl]);

  useEffect(() => {
    setFallbackIdx(0);
    setLoadedSrc("");
    setPreviewOpen(false);
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, [itemKey]);

  useEffect(() => {
    return () => {
      if (hoverCloseTimerRef.current) {
        clearTimeout(hoverCloseTimerRef.current);
        hoverCloseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!previewOpen) return;

    const onDocClick = (event) => {
      if (!previewRef.current) return;
      if (!previewRef.current.contains(event.target)) {
        setPreviewOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [previewOpen]);

  useEffect(() => {
    if (!previewOpen) return;

    const updatePopoverLayout = () => {
      const anchorEl = previewRef.current;
      const panelEl = popoverPanelRef.current;
      const boundaryEl = widgetBoundaryRef?.current || anchorEl?.closest('[data-recent-acquisitions-boundary="true"]');

      if (!anchorEl || !panelEl || !boundaryEl) return;

      const gap = 8;
      const panelChrome = 18;
      const targetImageHeight = 250;

      const anchorRect = anchorEl.getBoundingClientRect();
      const boundaryRect = boundaryEl.getBoundingClientRect();
      const pointerY = pointerClientYRef.current ?? anchorRect.top + anchorRect.height / 2;

      const maxWidth = Math.max(160, Math.floor(boundaryRect.width - gap * 2));
      const panelWidth = Math.min(panelEl.offsetWidth || maxWidth, maxWidth);
      const belowSpace = Math.max(0, Math.floor(boundaryRect.bottom - pointerY - gap));
      const aboveSpace = Math.max(0, Math.floor(pointerY - boundaryRect.top - gap));

      const maxImageBelow = Math.max(1, belowSpace - panelChrome);
      const maxImageAbove = Math.max(1, aboveSpace - panelChrome);

      const canFitTargetBelow = maxImageBelow >= targetImageHeight;
      const canFitTargetAbove = maxImageAbove >= targetImageHeight;
      const placeBelow = canFitTargetBelow ? true : canFitTargetAbove ? false : maxImageBelow >= maxImageAbove;

      const imageMaxHeight = Math.min(targetImageHeight, placeBelow ? maxImageBelow : maxImageAbove);
      const panelHeight = imageMaxHeight + panelChrome;

      let topGlobal = placeBelow ? pointerY + gap : pointerY - gap - panelHeight;

      if (placeBelow) {
        const maxTop = boundaryRect.bottom - gap - panelHeight;
        topGlobal = Math.min(topGlobal, maxTop);
      } else {
        const minTop = boundaryRect.top + gap;
        topGlobal = Math.max(topGlobal, minTop);
      }

      let leftGlobal = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
      const minLeft = boundaryRect.left + gap;
      const maxLeft = boundaryRect.right - gap - panelWidth;
      leftGlobal = Math.min(Math.max(leftGlobal, minLeft), Math.max(minLeft, maxLeft));

      const nextLayout = {
        left: Math.round(leftGlobal - anchorRect.left),
        top: Math.round(topGlobal - anchorRect.top),
        maxWidth,
        imageMaxHeight,
      };

      setPopoverLayout((prev) => {
        if (
          prev.left === nextLayout.left &&
          prev.top === nextLayout.top &&
          prev.maxWidth === nextLayout.maxWidth &&
          prev.imageMaxHeight === nextLayout.imageMaxHeight
        ) {
          return prev;
        }
        return nextLayout;
      });
    };

    const rafId = requestAnimationFrame(updatePopoverLayout);
    window.addEventListener("resize", updatePopoverLayout);
    window.addEventListener("scroll", updatePopoverLayout, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePopoverLayout);
      window.removeEventListener("scroll", updatePopoverLayout, true);
    };
  }, [previewOpen, widgetBoundaryRef]);

  const candidateSrc = candidates[Math.min(fallbackIdx, candidates.length - 1)];
  const thumbnailSrc = loadedSrc || candidateSrc || defaultImage;

  const stepFallback = () => {
    setFallbackIdx((prev) => Math.min(prev + 1, candidates.length - 1));
  };

  const clearHoverCloseTimer = () => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const openPreview = (event) => {
    if (typeof event?.clientY === "number") {
      pointerClientYRef.current = event.clientY;
    } else {
      const anchorRect = previewRef.current?.getBoundingClientRect();
      pointerClientYRef.current = anchorRect ? anchorRect.top + anchorRect.height / 2 : null;
    }
    clearHoverCloseTimer();
    setPreviewOpen(true);
  };

  const scheduleClosePreview = () => {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = setTimeout(() => {
      setPreviewOpen(false);
    }, 120);
  };

  return (
    <div className="relative shrink-0" ref={previewRef}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={previewOpen}
        aria-label={`Preview ${item?.name || "collectible"} image`}
        className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70"
        onClick={openPreview}
        onFocus={openPreview}
        onBlur={scheduleClosePreview}
        onMouseEnter={openPreview}
        onMouseLeave={scheduleClosePreview}
      >
        <img
          src={thumbnailSrc}
          alt={item?.name || "Collectible"}
          className="h-[100px] w-[100px] rounded-md bg-black/30 object-contain"
          onLoad={(e) => {
            const loaded = e.currentTarget.currentSrc || thumbnailSrc;
            setLoadedSrc(loaded);
          }}
          onError={(e) => {
            if (fallbackIdx >= candidates.length - 1) {
              e.currentTarget.src = finalSvgFallback;
              return;
            }
            stepFallback();
          }}
        />
      </button>

      {previewOpen && (
        <div
          ref={popoverPanelRef}
          role="dialog"
          aria-label={`${item?.name || "Collectible"} preview`}
          className="absolute z-30 w-[266px] rounded-xl border border-gray-700/80 bg-gray-950/95 p-2 shadow-2xl backdrop-blur-sm"
          style={{
            left: `${popoverLayout.left}px`,
            top: popoverLayout.top == null ? "calc(100% + 0.5rem)" : `${popoverLayout.top}px`,
            maxWidth: popoverLayout.maxWidth ? `${popoverLayout.maxWidth}px` : undefined,
          }}
          onMouseEnter={openPreview}
          onMouseLeave={scheduleClosePreview}
        >
          <img
            src={thumbnailSrc}
            alt={item?.name || "Collectible"}
            className="h-[250px] w-[250px] max-w-full rounded-lg bg-black/30 object-contain"
            style={{ maxHeight: `${popoverLayout.imageMaxHeight}px` }}
            onError={(e) => {
              e.currentTarget.src = finalSvgFallback;
            }}
          />
        </div>
      )}
    </div>
  );
};
const RecentAcquisitionsWidget = ({ acquisitions, loading }) => {
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const widgetBoundaryRef = useRef(null);

  const displayItems = useMemo(() => {
    const items = acquisitions || [];
    return [...items].sort((a, b) => {
      const aTime = new Date(a.obtainedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.obtainedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [acquisitions]);
  const [page, setPage] = useState(0);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(displayItems.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return displayItems.slice(start, start + pageSize);
  }, [displayItems, currentPage]);

  useEffect(() => {
    setPage(0);
  }, [acquisitions]);

  return (
    <Widget title="Recent Acquisitions">
      {loading ? (
        <p className="text-sm text-text-tertiary">Loading...</p>
      ) : displayItems.length > 0 ? (
        <div className="space-y-3" ref={widgetBoundaryRef} data-recent-acquisitions-boundary="true">
          <ul className="grid grid-cols-2 gap-3">
            {pageItems.map((item, index) => (
              <li
                key={`${item.name}-${item.type}-${index}`}
                className="relative flex min-w-0 items-center gap-2.5 text-sm"
              >
                <AcquisitionImageThumb
                  item={item}
                  itemKey={`${item.name || "unknown"}-${item.type || "collectible"}-${item.obtainedAt || index}`}
                  serverBaseUrl={serverBaseUrl}
                  widgetBoundaryRef={widgetBoundaryRef}
                />
                <div className="min-w-0">
                  <p className="truncate text-white font-medium">{item.name || "Unknown Collectible"}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs text-gray-500">{item.type || "Collectible"}</p>
                    <span className="inline-flex rounded-full border border-teal-400/30 bg-teal-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-teal-300">
                      {String(item.rarity || "common").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="inline-flex w-full items-center justify-between rounded-lg border border-gray-700/60 bg-black/25 p-1 sm:w-auto sm:min-w-[150px]">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-lg px-3 py-2 text-xs text-text-secondary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
              >
                Prev
              </button>
              <span className="px-2 font-mono text-xs text-text-secondary">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded-lg px-3 py-2 text-xs text-text-secondary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">No items acquired recently.</p>
      )}
    </Widget>
  );
};

export default RecentAcquisitionsWidget;
