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
  const { editMode, moveWidget, widgetVisibility } = useLayout();
  const visibleItems = items.filter((item) => widgetVisibility[item.id] !== false);

  const onDragStartItem = (e, itemId) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ id: itemId, fromColumn: columnId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropAt = (id, fromColumn, index) => {
    moveWidget(id, columnId, index);
  };

  return (
    <div className="min-w-0 space-y-2" onDragOver={(e) => e.preventDefault()}>
      {visibleItems.map((item, i) => {
        const Comp = registry[item.key];
        if (!Comp) return null;
        return (
          <React.Fragment key={item.id}>
            {editMode && <DropZone columnId={columnId} index={i} onDropHere={handleDropAt} />}
            <div
              draggable={editMode}
              onDragStart={(e) => onDragStartItem(e, item.id)}
              className={editMode ? "cursor-move" : ""}
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
  const { columns, activeColumnCount } = useLayout();
  const allColumnIds = ["col1", "col2", "col3", "col4"];
  const columnIds = allColumnIds.slice(0, activeColumnCount || 4);

  const gridClass =
    activeColumnCount === 1
      ? "grid grid-cols-1 gap-3 items-start"
      : activeColumnCount === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-3 items-start"
        : activeColumnCount === 3
          ? "grid grid-cols-1 md:grid-cols-3 gap-3 items-start"
          : "grid grid-cols-1 md:grid-cols-3 min-[1600px]:grid-cols-4 gap-3 items-start";

  return (
    <div className={gridClass}>
      {columnIds.map((id) => (
        <Column key={id} id={id} items={columns[id] || []} extraProps={extraProps} />
      ))}
    </div>
  );
}
