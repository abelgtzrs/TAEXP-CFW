import React from "react";
import { useLayout } from "../../../context/LayoutContext";

const sizeToPx = (size) => {
  switch (size) {
    case "sm":
      return 192;
    case "md":
      return 256;
    case "lg":
      return 320;
    case "xl":
      return 448;
    default:
      return 256;
  }
};

export default function DraggableWidgetShell({ item, columnId, index, children }) {
  const { editMode, resizeWidget, adjustHeight, moveWidgetToAdjacentColumn, reorderWithinColumn, columns } =
    useLayout();

  const height = item.height ?? sizeToPx(item.size);
  const maxW = item.maxWidth ?? null;

  return (
    <div
      className="relative w-full grid"
      data-item-id={item.id}
      style={{
        minHeight: `${height}px`,
        maxWidth: maxW ? `${maxW}px` : undefined,
        marginLeft: maxW ? "auto" : undefined,
        marginRight: maxW ? "auto" : undefined,
      }}
    >
      {editMode && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          {/* Reorder within column */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (index > 0) reorderWithinColumn(columnId, index, index - 1);
            }}
            className="px-2 py-1 text-[10px] rounded border bg-slate-800/80 border-slate-600 hover:bg-slate-700"
            title="Move up"
            disabled={index === 0}
          >
            ↑
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              const maxIdx = (columns?.[columnId]?.length ?? 1) - 1;
              if (index < maxIdx) reorderWithinColumn(columnId, index, index + 1);
            }}
            className="px-2 py-1 text-[10px] rounded border bg-slate-800/80 border-slate-600 hover:bg-slate-700"
            title="Move down"
            disabled={index >= (columns?.[columnId]?.length ?? 1) - 1}
          >
            ↓
          </button>
          {/* Column move buttons */}
          <button
            onClick={(e) => {
              e.preventDefault();
              moveWidgetToAdjacentColumn(item.id, "left");
            }}
            className="px-2 py-1 text-[10px] rounded border bg-slate-800/80 border-slate-600 hover:bg-slate-700"
            title="Move to previous column"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              moveWidgetToAdjacentColumn(item.id, "right");
            }}
            className="px-2 py-1 text-[10px] rounded border bg-slate-800/80 border-slate-600 hover:bg-slate-700"
            title="Move to next column"
          >
            →
          </button>

          {/* Height fine controls */}
          <button
            onClick={(e) => {
              e.preventDefault();
              adjustHeight(item.id, -5);
            }}
            className="px-2 py-1 text-[10px] rounded border bg-slate-800/80 border-slate-600 hover:bg-slate-700"
            title="Reduce height by 5px"
          >
            -5px
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              adjustHeight(item.id, 5);
            }}
            className="px-2 py-1 text-[10px] rounded border bg-slate-800/80 border-slate-600 hover:bg-slate-700"
            title="Increase height by 5px"
          >
            +5px
          </button>

          {/* Preset sizes (keep for quick jumps) */}
          {["sm", "md", "lg", "xl"].map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.preventDefault();
                resizeWidget(item.id, s);
              }}
              className={`px-2 py-1 text-[10px] rounded border ${
                item.size === s
                  ? "bg-emerald-600 border-emerald-500"
                  : "bg-slate-800/80 border-slate-600 hover:bg-slate-700"
              }`}
              title={`Set ${s.toUpperCase()} height`}
            >
              {s.toUpperCase()}
            </button>
          ))}

          {/* Width controls removed per request */}
        </div>
      )}
      {children}
    </div>
  );
}
