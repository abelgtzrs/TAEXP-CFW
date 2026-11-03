import { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Copy, Download, X } from "lucide-react";
import VolumeStatusBadge from "./VolumeStatusBadge";
import { buildExportText, copyToClipboard, downloadTxt } from "../../pages/volumeFunctionality/exportHelpers";

// Render inside <AnimatePresence> while open; selection starts at the published volumes on each open.
const VolumeExportModal = ({ volumes, onClose, onNotice }) => {
  const exportableVolumes = useMemo(
    () => [...volumes].sort((a, b) => (Number(a.volumeNumber) || 0) - (Number(b.volumeNumber) || 0)),
    [volumes],
  );
  const [exportSelectedIds, setExportSelectedIds] = useState(() =>
    exportableVolumes.filter((volume) => volume.status === "published").map((volume) => volume._id),
  );

  const selectedExportVolumes = useMemo(
    () => exportableVolumes.filter((volume) => exportSelectedIds.includes(volume._id)),
    [exportableVolumes, exportSelectedIds],
  );

  const exportText = useMemo(() => buildExportText(selectedExportVolumes), [selectedExportVolumes]);

  const toggleExportVolume = (id) => {
    setExportSelectedIds((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id],
    );
  };

  const copyExportToClipboard = async () => {
    const copied = await copyToClipboard(exportText);
    onNotice(copied ? "Export copied to clipboard" : "Copy failed—select the preview and copy it manually");
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <Motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-surface shadow-2xl md:h-auto md:max-h-[88dvh] md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <div>
            <div className="flex items-center gap-2">
              <Download size={18} className="text-primary" />
              <h3 className="text-lg font-semibold text-white">Export volumes</h3>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Choose entries, review the raw text, then copy or download it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
            aria-label="Close export dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setExportSelectedIds(exportableVolumes.map((volume) => volume._id))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() =>
              setExportSelectedIds(
                exportableVolumes.filter((volume) => volume.status === "published").map((volume) => volume._id),
              )
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
          >
            Published only
          </button>
          <button
            type="button"
            onClick={() => setExportSelectedIds([])}
            className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-white"
          >
            Clear
          </button>
          <span className="ml-auto text-xs tabular-nums text-text-secondary">
            {selectedExportVolumes.length} of {exportableVolumes.length} selected
          </span>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 md:grid-cols-[0.85fr_1.15fr] sm:p-4">
          <div className="min-h-0 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-2">
            {exportableVolumes.map((volume) => {
              const checked = exportSelectedIds.includes(volume._id);
              return (
                <label
                  key={volume._id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                    checked ? "border-primary/40 bg-primary/10" : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleExportVolume(volume._id)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">
                    Vol {volume.volumeNumber}: {volume.title || "Untitled"}
                  </span>
                  <VolumeStatusBadge status={volume.status} />
                </label>
              );
            })}
          </div>

          <div className="hidden min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/25 md:flex">
            <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Raw text preview
            </div>
            <textarea
              readOnly
              value={exportText}
              className="min-h-[360px] flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-5 text-gray-200 outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 bg-black/10 p-3 sm:justify-end sm:px-5">
          <button
            type="button"
            onClick={copyExportToClipboard}
            disabled={!selectedExportVolumes.length}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <Copy size={15} /> Copy
          </button>
          <button
            type="button"
            onClick={() => downloadTxt(exportText, "volumes-export")}
            disabled={!selectedExportVolumes.length}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <Download size={15} /> Download .txt
          </button>
        </div>
      </Motion.div>
    </Motion.div>
  );
};

export default VolumeExportModal;
