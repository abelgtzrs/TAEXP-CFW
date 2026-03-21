import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Save, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  applyBottomNavOrder,
  clearBottomNavOrder,
  getSavedBottomNavOrder,
  getVisibleBottomNavLinks,
  saveBottomNavOrder,
} from "../components/layout/bottomNavConfig";

const BottomNavOrderPage = () => {
  const { user } = useAuth();

  const defaultLinks = useMemo(() => getVisibleBottomNavLinks(user?.role), [user?.role]);

  const [links, setLinks] = useState(() => {
    const savedOrder = getSavedBottomNavOrder();
    return applyBottomNavOrder(defaultLinks, savedOrder);
  });

  const [message, setMessage] = useState("");

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;

    const next = [...links];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setLinks(next);
    setMessage("");
  };

  const handleSave = () => {
    saveBottomNavOrder(links.map((link) => link.to));
    setMessage("Bottom nav order saved.");
  };

  const handleReset = () => {
    clearBottomNavOrder();
    setLinks(defaultLinks);
    setMessage("Bottom nav order reset to default.");
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Bottom Nav Order</h1>
        <p className="text-sm text-text-secondary mt-1">
          Reorder the mobile bottom nav links. The Menu and Organize buttons stay fixed.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
        >
          <Save size={16} />
          Save Order
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
        >
          <RotateCcw size={16} />
          Reset Default
        </button>
      </div>

      {message && <div className="text-sm text-green-400">{message}</div>}

      <div className="space-y-2">
        {links.map((link, idx) => (
          <div
            key={link.to}
            className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-surface/40 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-6">{idx + 1}</span>
              <span className="text-white">{link.label}</span>
              <span className="text-xs text-text-secondary">{link.to}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => moveItem(idx, -1)}
                disabled={idx === 0}
                className="p-2 rounded bg-surface/60 hover:bg-surface/80 disabled:opacity-40"
                aria-label={`Move ${link.label} up`}
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => moveItem(idx, 1)}
                disabled={idx === links.length - 1}
                className="p-2 rounded bg-surface/60 hover:bg-surface/80 disabled:opacity-40"
                aria-label={`Move ${link.label} down`}
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottomNavOrderPage;
