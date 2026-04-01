import React from "react";
import Widget from "../ui/Widget";

const STORAGE_KEY = "tae.countdown.events.v1";
const LEGACY_KEY = "tae.countdown";

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / (24 * 3600));
  const hours = Math.floor((total % (24 * 3600)) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}d ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function defaultTarget() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0); // first of next month
  return next.toISOString();
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function buildDefaultState() {
  const eventId = makeId();
  const countdownId = makeId();
  return {
    events: [
      {
        id: eventId,
        name: "General",
        countdowns: [{ id: countdownId, title: "Next Month", target: defaultTarget() }],
      },
    ],
    selectedEventId: eventId,
    selectedCountdownId: countdownId,
  };
}

function migrateLegacyIfNeeded() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.events?.length) return parsed;
    }

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return buildDefaultState();
    const eventId = makeId();
    const countdownId = makeId();
    return {
      events: [
        {
          id: eventId,
          name: "General",
          countdowns: [{ id: countdownId, title: "Legacy Countdown", target: legacy }],
        },
      ],
      selectedEventId: eventId,
      selectedCountdownId: countdownId,
    };
  } catch {
    return buildDefaultState();
  }
}

export default function CountdownWidget() {
  const [state, setState] = React.useState(migrateLegacyIfNeeded);
  const [remaining, setRemaining] = React.useState(0);
  const [newEventName, setNewEventName] = React.useState("");
  const [newCountdownTitle, setNewCountdownTitle] = React.useState("");
  const [newCountdownTarget, setNewCountdownTarget] = React.useState(() => defaultTarget().slice(0, 16));

  const selectedEvent = React.useMemo(
    () => state.events.find((e) => e.id === state.selectedEventId) || state.events[0] || null,
    [state],
  );

  const selectedCountdown = React.useMemo(() => {
    if (!selectedEvent) return null;
    return (
      selectedEvent.countdowns.find((c) => c.id === state.selectedCountdownId) || selectedEvent.countdowns[0] || null
    );
  }, [selectedEvent, state.selectedCountdownId]);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  React.useEffect(() => {
    let raf;
    const tick = () => {
      const t = selectedCountdown?.target ? new Date(selectedCountdown.target).getTime() : 0;
      setRemaining(t - Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selectedCountdown?.target]);

  const addEvent = () => {
    const name = newEventName.trim();
    if (!name) return;
    const eventId = makeId();
    const countdownId = makeId();
    setState((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: eventId,
          name,
          countdowns: [{ id: countdownId, title: "New Countdown", target: defaultTarget() }],
        },
      ],
      selectedEventId: eventId,
      selectedCountdownId: countdownId,
    }));
    setNewEventName("");
  };

  const addCountdown = () => {
    if (!selectedEvent) return;
    const title = newCountdownTitle.trim() || `Countdown ${selectedEvent.countdowns.length + 1}`;
    if (!newCountdownTarget) return;
    const iso = new Date(newCountdownTarget).toISOString();
    const id = makeId();
    setState((prev) => ({
      ...prev,
      events: prev.events.map((ev) =>
        ev.id === selectedEvent.id ? { ...ev, countdowns: [...ev.countdowns, { id, title, target: iso }] } : ev,
      ),
      selectedCountdownId: id,
    }));
    setNewCountdownTitle("");
  };

  const updateSelectedCountdownTarget = (val) => {
    if (!selectedEvent || !selectedCountdown || !val) return;
    const iso = new Date(val).toISOString();
    setState((prev) => ({
      ...prev,
      events: prev.events.map((ev) =>
        ev.id === selectedEvent.id
          ? {
              ...ev,
              countdowns: ev.countdowns.map((cd) => (cd.id === selectedCountdown.id ? { ...cd, target: iso } : cd)),
            }
          : ev,
      ),
    }));
  };

  const removeCountdown = (countdownId) => {
    if (!selectedEvent) return;
    if (selectedEvent.countdowns.length === 1) return;
    setState((prev) => {
      const nextEvents = prev.events.map((ev) =>
        ev.id === selectedEvent.id ? { ...ev, countdowns: ev.countdowns.filter((cd) => cd.id !== countdownId) } : ev,
      );
      const nextEvent = nextEvents.find((ev) => ev.id === selectedEvent.id);
      const nextSelectedCountdownId =
        prev.selectedCountdownId === countdownId ? nextEvent?.countdowns?.[0]?.id || null : prev.selectedCountdownId;
      return { ...prev, events: nextEvents, selectedCountdownId: nextSelectedCountdownId };
    });
  };

  return (
    <Widget title="Countdown" className="min-h-[440px] sm:h-[360px] overflow-hidden">
      <div className="h-full flex flex-col gap-2.5 sm:gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            className="bg-background border border-gray-700/60 rounded px-2.5 py-2 sm:py-1.5 text-xs sm:text-xs"
            value={selectedEvent?.id || ""}
            onChange={(e) =>
              setState((prev) => {
                const nextEvent = prev.events.find((ev) => ev.id === e.target.value);
                return {
                  ...prev,
                  selectedEventId: e.target.value,
                  selectedCountdownId: nextEvent?.countdowns?.[0]?.id || null,
                };
              })
            }
          >
            {state.events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="New event"
              className="flex-1 bg-background border border-gray-700/60 rounded px-2.5 py-2 sm:py-1.5 text-xs"
            />
            <button className="px-3 py-2 sm:py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600" onClick={addEvent}>
              Add
            </button>
          </div>
        </div>

        <div className="text-center text-xl sm:text-2xl font-mono">{formatDuration(remaining)}</div>
        <div className="text-xs text-center text-slate-400">{selectedCountdown?.title || "Select a countdown"}</div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="datetime-local"
            className="flex-1 bg-background border border-gray-700/60 rounded px-2.5 py-2 sm:py-1.5 text-xs"
            value={selectedCountdown?.target ? new Date(selectedCountdown.target).toISOString().slice(0, 16) : ""}
            onChange={(e) => updateSelectedCountdownTarget(e.target.value)}
          />
          <button
            className="px-3 py-2 sm:py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-white"
            onClick={() => updateSelectedCountdownTarget(defaultTarget().slice(0, 16))}
          >
            Next Month
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input
            type="text"
            value={newCountdownTitle}
            onChange={(e) => setNewCountdownTitle(e.target.value)}
            placeholder="Countdown title"
            className="bg-background border border-gray-700/60 rounded px-2.5 py-2 sm:py-1.5 text-xs"
          />
          <input
            type="datetime-local"
            value={newCountdownTarget}
            onChange={(e) => setNewCountdownTarget(e.target.value)}
            className="bg-background border border-gray-700/60 rounded px-2.5 py-2 sm:py-1.5 text-xs"
          />
          <button
            className="px-3 py-2 sm:py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600"
            onClick={addCountdown}
          >
            Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {(selectedEvent?.countdowns || []).map((cd) => {
            const isSelected = cd.id === selectedCountdown?.id;
            const rem = new Date(cd.target).getTime() - Date.now();
            return (
              <div
                key={cd.id}
                className={`p-2.5 rounded border text-xs flex items-center justify-between gap-2 ${
                  isSelected ? "border-emerald-500/60 bg-emerald-500/10" : "border-gray-700/60 bg-background/50"
                }`}
              >
                <button
                  className="text-left flex-1 min-w-0"
                  onClick={() => setState((prev) => ({ ...prev, selectedCountdownId: cd.id }))}
                >
                  <div className="truncate text-white">{cd.title}</div>
                  <div className="text-[10px] text-slate-400">{formatDuration(rem)}</div>
                </button>
                <button
                  className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800/60 text-[10px]"
                  onClick={() => removeCountdown(cd.id)}
                  title="Delete countdown"
                >
                  Del
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}
