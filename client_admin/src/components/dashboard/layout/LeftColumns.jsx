import React from "react";
import { useLayout } from "../../../context/LayoutContext";
import { registry } from "./widgetRegistry";
import DraggableWidgetShell from "./DraggableWidgetShell";

function DropZone({ columnId, index, onDropHere, isActive }) {
  return (
    <div
      className={`h-3 my-1 rounded transition-colors ${isActive ? "bg-emerald-500/60" : "bg-transparent"}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData("application/json"));
          onDropHere(data.id, data.fromColumn, index);
        } catch {}
      }}
    />
  );
}

function Column({ id: columnId, items, extraProps }) {
  const { editMode, moveWidget, widgetVisibility, pinnedWidgets } = useLayout();
  const visibleItems = items.filter((item) => widgetVisibility[item.id] !== false && !pinnedWidgets.includes(item.id));

  const onDragStartItem = (e, itemId) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ id: itemId, fromColumn: columnId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropAt = (id, fromColumn, index) => {
    moveWidget(id, columnId, index);
  };

  return (
    <div className="min-w-0 flex flex-col space-y-4" onDragOver={(e) => e.preventDefault()}>
      {visibleItems.map((item, i) => {
        const Comp = registry[item.key];
        if (!Comp) return null;
        return (
          <React.Fragment key={item.id}>
            {editMode && <DropZone columnId={columnId} index={i} onDropHere={handleDropAt} />}
            <div
              draggable={editMode}
              onDragStart={(e) => onDragStartItem(e, item.id)}
              // Last widget stretches so every column ends at the same height
              className={`widget-enter grid ${i === visibleItems.length - 1 ? "flex-1" : ""} ${editMode ? "cursor-move" : ""}`}
              style={{ animationDelay: `${Math.min(i * 35, 140)}ms` }}
            >
              <DraggableWidgetShell item={item} columnId={columnId} index={i}>
                <Comp {...extraProps} />
              </DraggableWidgetShell>
            </div>
          </React.Fragment>
        );
      })}
      {editMode && <DropZone columnId={columnId} index={visibleItems.length} onDropHere={handleDropAt} />}
    </div>
  );
}

export default function LeftColumns({ extraProps }) {
  const { columns, activeColumnCount, widgetVisibility, pinnedWidgets } = useLayout();
  const allColumnIds = ["col1", "col2", "col3", "col4"];
  const columnIds = allColumnIds.slice(0, activeColumnCount || 4);

  const colsMap = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
  const gridClass = `grid ${colsMap[activeColumnCount] ?? "grid-cols-4"} gap-4 items-stretch`;

  const pinnedItems = pinnedWidgets
    .map((pinnedId) => {
      for (const columnId of allColumnIds) {
        const index = (columns[columnId] || []).findIndex((item) => item.id === pinnedId);
        if (index !== -1) return { item: columns[columnId][index], columnId, index };
      }
      return null;
    })
    .filter((entry) => entry && widgetVisibility[entry.item.id] !== false);

  return (
    <div className="space-y-4">
      {pinnedItems.length > 0 && (
        <div className={gridClass}>
          {pinnedItems.map(({ item, columnId, index }) => {
            const Comp = registry[item.key];
            if (!Comp) return null;
            return (
              <div key={item.id} className="widget-enter grid min-w-0">
                <DraggableWidgetShell item={item} columnId={columnId} index={index}>
                  <Comp {...extraProps} />
                </DraggableWidgetShell>
              </div>
            );
          })}
        </div>
      )}
      <div className={gridClass}>
        {columnIds.map((id) => (
          <Column key={id} id={id} items={columns[id] || []} extraProps={extraProps} />
        ))}
      </div>
    </div>
  );
}
