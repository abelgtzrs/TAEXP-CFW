import React from "react";
import Widget from "../ui/Widget";

const STORAGE_KEY = "tae.focusTimer";

function format(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function FocusTimerWidget() {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw
        ? JSON.parse(raw)
        : { duration: 25 * 60 * 1000, remaining: 25 * 60 * 1000, running: false, lastTick: 0 };
    } catch {
      return { duration: 25 * 60 * 1000, remaining: 25 * 60 * 1000, running: false, lastTick: 0 };
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  React.useEffect(() => {
    if (!state.running) return;
    let raf;
    const tick = (t) => {
      setState((prev) => {
        const now = Date.now();
        const dt = prev.lastTick ? now - prev.lastTick : 0;
        const next = Math.max(0, prev.remaining - dt);
        return { ...prev, remaining: next, running: next > 0, lastTick: now };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.running]);

  const start = () => setState((p) => ({ ...p, running: true, lastTick: Date.now() }));
  const pause = () => setState((p) => ({ ...p, running: false, lastTick: 0 }));
  const reset = () => setState((p) => ({ ...p, remaining: p.duration, running: false, lastTick: 0 }));
  const setMinutes = (mins) => {
    const ms = Math.max(1, Number(mins)) * 60 * 1000;
    setState({ duration: ms, remaining: ms, running: false, lastTick: 0 });
  };

  return (
    <Widget title="Focus Timer" className="h-[220px] overflow-hidden">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div className="dash-value text-4xl leading-none">{format(state.remaining)}</div>
          <span className="dash-tag">{state.running ? "Running" : state.remaining < state.duration ? "Paused" : "Ready"}</span>
        </div>
        <div className="dash-meter">
          <span style={{ width: `${(1 - state.remaining / state.duration) * 100}%` }} />
        </div>
        <div className="flex items-center gap-2">
          {!state.running ? (
            <button onClick={start} className="dash-btn dash-btn-primary">
              Start
            </button>
          ) : (
            <button onClick={pause} className="dash-btn dash-btn-primary">
              Pause
            </button>
          )}
          <button onClick={reset} className="dash-btn">
            Reset
          </button>
          <label className="ml-auto flex items-center gap-2 text-[11px] text-text-secondary">
            Min
            <input
              type="number"
              min={1}
              max={180}
              className="dash-input w-16 tabular-nums"
              value={Math.round(state.duration / 60000)}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
        </div>
      </div>
    </Widget>
  );
}
