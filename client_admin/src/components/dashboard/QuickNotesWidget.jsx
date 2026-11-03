import React from "react";
import { X } from "lucide-react";
import Widget from "../ui/Widget";

const STORAGE_KEY = "tae.quickNotes";

export default function QuickNotesWidget() {
  const [notes, setNotes] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const addNote = () => {
    const t = text.trim();
    if (!t) return;
    setNotes((prev) => [{ id: Date.now(), text: t }, ...prev]);
    setText("");
  };

  const removeNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));

  return (
    <Widget title="Quick Notes" className="h-[220px] overflow-hidden">
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Jot something down…"
            className="dash-input flex-1"
          />
          <button onClick={addNote} className="dash-btn dash-btn-primary">
            Add
          </button>
        </div>
        <ul className="dash-rows max-h-44 overflow-auto pr-1">
          {notes.length === 0 && <li className="text-text-secondary text-xs py-2">No notes yet.</li>}
          {notes.map((n) => (
            <li key={n.id} className="group flex items-start gap-2 py-1.5">
              <span className="flex-1 whitespace-pre-wrap break-words text-xs text-text-main">{n.text}</span>
              <button
                onClick={() => removeNote(n.id)}
                className="dash-btn dash-btn-icon dash-btn-danger !min-h-[22px] !w-[22px]"
                title="Delete note"
                aria-label="Delete note"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Widget>
  );
}
