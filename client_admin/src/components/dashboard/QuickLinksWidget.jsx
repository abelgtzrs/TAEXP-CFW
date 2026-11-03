import React from "react";
import { ExternalLink, X } from "lucide-react";
import Widget from "../ui/Widget";

const STORAGE_KEY = "tae.quickLinks";

export default function QuickLinksWidget() {
  const [links, setLinks] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch {}
  }, [links]);

  const addLink = () => {
    const t = title.trim();
    const u = url.trim();
    if (!t || !u) return;
    setLinks((prev) => [{ id: Date.now(), title: t, url: u }, ...prev]);
    setTitle("");
    setUrl("");
  };

  const remove = (id) => setLinks((prev) => prev.filter((l) => l.id !== id));

  return (
    <Widget title="Quick Links" className="h-[220px] overflow-hidden">
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Label"
            className="dash-input col-span-1 min-w-0"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            placeholder="https://example.com"
            className="dash-input col-span-1 min-w-0"
          />
          <button onClick={addLink} className="dash-btn dash-btn-primary">
            Add
          </button>
        </div>
        <ul className="dash-rows max-h-44 overflow-auto pr-1">
          {links.length === 0 && <li className="text-text-secondary text-xs py-2">No links yet.</li>}
          {links.map((l) => (
            <li key={l.id} className="flex items-center gap-2 py-1.5">
              <ExternalLink size={12} className="shrink-0 text-text-secondary" aria-hidden="true" />
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-xs text-text-main hover:text-primary"
                title={l.url}
              >
                {l.title}
              </a>
              <button
                onClick={() => remove(l.id)}
                className="dash-btn dash-btn-icon dash-btn-danger !min-h-[22px] !w-[22px]"
                title="Delete link"
                aria-label="Delete link"
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
