import React from "react";
import { RefreshCw } from "lucide-react";
import Widget from "../ui/Widget";
import api from "../../services/api";

export default function DailyQuoteWidget() {
  const [blessings, setBlessings] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadRandomBlessings = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        api.get(`/public/random-blessing`),
        api.get(`/public/random-blessing`),
        api.get(`/public/random-blessing`),
      ]);

      const nextBlessings = responses
        .map((res) => res.data?.data)
        .filter(Boolean)
        .map((data) => ({
          name: data.name,
          description: data.description || "",
          volumeNumber: data.volumeNumber ?? null,
        }));

      setBlessings(nextBlessings);
    } catch (e) {
      setError("Could not load random blessings.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRandomBlessings();
  }, [loadRandomBlessings]);

  return (
    <Widget title="Daily Blessings" className="h-[460px] overflow-hidden" padding="p-4">
      <div className="h-full flex flex-col gap-3">
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-3 text-sm text-text-secondary">Fetching blessings…</p>
          ) : error ? (
            <p className="py-3 text-sm text-rose-300">{error}</p>
          ) : (
            <div className="dash-rows">
              {blessings.map((blessing, idx) => (
                <div key={`${blessing.name}-${idx}`} className="py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-semibold leading-tight text-text-main">{blessing.name}</div>
                    {blessing.volumeNumber ? <span className="dash-tag">Vol {blessing.volumeNumber}</span> : null}
                  </div>
                  <div className="mt-1.5 text-sm leading-6 text-text-secondary">
                    {blessing.description || "No description available."}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
          <span className="text-[11px] text-text-secondary">3 random picks</span>
          <button
            onClick={loadRandomBlessings}
            disabled={loading}
            className="dash-btn"
            title="Load three new random blessings"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Shuffle
          </button>
        </div>
      </div>
    </Widget>
  );
}
