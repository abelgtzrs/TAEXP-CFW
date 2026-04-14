import React from "react";
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
        <div className="flex items-center justify-between text-sm text-slate-200">
          <span className="font-semibold tracking-wide">3 Random Picks</span>
          <span className="text-slate-300">Refresh for more</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="rounded-md border border-white/10 bg-black/30 px-4 py-3 text-base leading-7 text-slate-100">
              Fetching blessings...
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-base leading-7 text-red-200">
              {error}
            </div>
          ) : (
            blessings.map((blessing, idx) => (
              <div key={`${blessing.name}-${idx}`} className="rounded-md border border-white/10 bg-black/30 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-lg font-semibold leading-tight text-white">{blessing.name}</div>
                  {blessing.volumeNumber ? (
                    <span className="text-sm text-slate-300 whitespace-nowrap">Vol {blessing.volumeNumber}</span>
                  ) : null}
                </div>
                <div className="mt-2 text-base leading-7 text-slate-100">
                  {blessing.description || "No description available."}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-1 flex items-center justify-end gap-2">
          <button
            onClick={loadRandomBlessings}
            disabled={loading}
            className="min-h-10 px-4 py-2 text-sm font-semibold rounded bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Load three new random blessings"
          >
            New 3 Blessings
          </button>
        </div>
      </div>
    </Widget>
  );
}
