import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Columns, ArrowLeft, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useLayout } from "../context/LayoutContext";
import LeftColumns from "../components/dashboard/layout/LeftColumns";

const COLUMN_OPTIONS = [1, 2, 3, 4];

export default function DashboardLayoutEditorPage() {
  const navigate = useNavigate();
  const {
    activeColumnCount,
    applyLayoutProfile,
    saveLayoutProfile,
    saveConfigurations,
    enableEditMode,
    disableEditMode,
    resetLayout,
    widgetCatalog,
    widgetVisibility,
    setWidgetVisible,
    autoColumnBreakpoints,
    setAutoColumnBreakpoints,
    resetAutoColumnBreakpoints,
    autoColumnRanges,
  } = useLayout();

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    enableEditMode();
    return () => {
      disableEditMode();
    };
  }, [enableEditMode, disableEditMode]);

  const onSaveAll = async () => {
    setSaving(true);
    setStatus("");
    try {
      await saveConfigurations();
      setStatus("Layout configurations saved.");
    } catch (e) {
      setStatus("Failed to save layout configurations.");
    } finally {
      setSaving(false);
    }
  };

  const prettifyLabel = (key) =>
    String(key || "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const updateBreakpoint = (key, rawValue) => {
    const nextValue = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(nextValue)) return;
    setAutoColumnBreakpoints((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const formatRangeLabel = (range) => {
    if (!range) return "-";
    if (range.max == null) return `>= ${range.min}px`;
    return `${range.min}px - ${range.max}px`;
  };

  return (
    <div className="max-w-[1800px] mx-auto px-2 md:px-4 py-3 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Layout Editor</h1>
          <p className="text-sm text-text-secondary">
            Drag and drop widgets, switch between 1-4 column configurations, and save when ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded border border-gray-600 bg-gray-800/80 hover:bg-gray-700 text-sm"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <button
            type="button"
            onClick={onSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded border border-emerald-400/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-sm disabled:opacity-60"
          >
            <Save size={14} /> {saving ? "Saving..." : "Save Configurations"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700/60 bg-surface p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-text-secondary">Column Config</span>
          {COLUMN_OPTIONS.map((count) => (
            <button
              key={`apply-${count}`}
              type="button"
              onClick={() => applyLayoutProfile(count)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs transition ${
                activeColumnCount === count
                  ? "border-emerald-400 bg-emerald-500/30 text-white"
                  : "border-gray-600 bg-gray-800/70 text-gray-200 hover:bg-gray-700"
              }`}
            >
              <Columns size={12} /> {count} Col
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-text-secondary">Save Slot</span>
          {COLUMN_OPTIONS.map((count) => (
            <button
              key={`save-${count}`}
              type="button"
              onClick={() => saveLayoutProfile(count)}
              className="px-2.5 py-1.5 rounded border border-gray-600 bg-gray-800/70 text-xs hover:bg-gray-700"
            >
              Save {count}
            </button>
          ))}
          <button
            type="button"
            onClick={resetLayout}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-500/40 bg-red-500/10 text-xs hover:bg-red-500/20"
          >
            <RotateCcw size={12} /> Reset Default
          </button>
        </div>

        <div className="rounded-lg border border-gray-700/60 bg-gray-900/30 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
              <SlidersHorizontal size={12} /> Auto Width Ranges
            </div>
            <button
              type="button"
              onClick={resetAutoColumnBreakpoints}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-gray-600 bg-gray-800/70 text-xs hover:bg-gray-700"
            >
              <RotateCcw size={12} /> Reset Ranges
            </button>
          </div>

          <p className="text-xs text-text-secondary">
            Define when the dashboard switches from 1 to 2, 3, and 4 columns. Values are in pixels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="flex flex-col gap-1.5 rounded border border-gray-700/70 bg-black/20 p-2">
              <span className="text-[11px] uppercase tracking-wide text-text-secondary">2 Col Start</span>
              <input
                type="number"
                min={1}
                step={1}
                value={autoColumnBreakpoints.twoColsMin}
                onChange={(e) => updateBreakpoint("twoColsMin", e.target.value)}
                className="px-2 py-1.5 rounded border border-gray-600 bg-gray-800/80 text-sm text-gray-100"
              />
            </label>

            <label className="flex flex-col gap-1.5 rounded border border-gray-700/70 bg-black/20 p-2">
              <span className="text-[11px] uppercase tracking-wide text-text-secondary">3 Col Start</span>
              <input
                type="number"
                min={1}
                step={1}
                value={autoColumnBreakpoints.threeColsMin}
                onChange={(e) => updateBreakpoint("threeColsMin", e.target.value)}
                className="px-2 py-1.5 rounded border border-gray-600 bg-gray-800/80 text-sm text-gray-100"
              />
            </label>

            <label className="flex flex-col gap-1.5 rounded border border-gray-700/70 bg-black/20 p-2">
              <span className="text-[11px] uppercase tracking-wide text-text-secondary">4 Col Start</span>
              <input
                type="number"
                min={1}
                step={1}
                value={autoColumnBreakpoints.fourColsMin}
                onChange={(e) => updateBreakpoint("fourColsMin", e.target.value)}
                className="px-2 py-1.5 rounded border border-gray-600 bg-gray-800/80 text-sm text-gray-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {COLUMN_OPTIONS.map((count) => (
              <div key={`range-${count}`} className="rounded border border-gray-700/70 bg-black/20 px-2.5 py-2">
                <div className="text-text-secondary">
                  {count} Column{count > 1 ? "s" : ""}
                </div>
                <div className="mt-1 text-gray-100">{formatRangeLabel(autoColumnRanges[count])}</div>
              </div>
            ))}
          </div>
        </div>

        {status ? <div className="text-xs text-emerald-300">{status}</div> : null}
      </div>

      <div className="rounded-lg border border-gray-700/60 bg-surface p-3 space-y-3">
        <div className="text-xs uppercase tracking-wide text-text-secondary">Visible Widgets</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {widgetCatalog.map((widget) => (
            <label
              key={widget.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded border border-gray-700/70 bg-gray-900/30"
            >
              <input
                type="checkbox"
                checked={widgetVisibility[widget.id] !== false}
                onChange={(e) => setWidgetVisible(widget.id, e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-xs text-gray-200">{prettifyLabel(widget.key || widget.id)}</span>
            </label>
          ))}
        </div>
      </div>

      <LeftColumns />
    </div>
  );
}
