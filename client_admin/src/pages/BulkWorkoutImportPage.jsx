import { useState } from "react";
import Widget from "../components/ui/Widget";
import api from "../services/api";
import {
  MUSCLE_GROUP_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  STRENGTH_PRESET,
  CARDIO_PRESET,
  FLEX_PRESET,
} from "../constants/exerciseOptions";

const example = `{"date":"2025-09-15","exercises":[{"nameRaw":"Lat Pulldown","unit":"lb","sets":[{"setNumber":1,"reps":12,"weight":100},{"setNumber":2,"reps":12,"weight":115},{"setNumber":3,"reps":5,"weight":115},{"setNumber":4,"reps":10,"weight":115,"notes":"reverse grip"}]},{"nameRaw":"Low Row","unit":"lb","sets":[{"setNumber":1,"reps":10,"weight":100},{"setNumber":2,"reps":7,"weight":100},{"setNumber":3,"reps":10,"weight":85},{"setNumber":4,"reps":5,"weight":85}]},{"nameRaw":"Rear Delt Fly","unit":"lb","sets":[{"setNumber":1,"reps":8,"weight":50},{"setNumber":2,"reps":12,"weight":40},{"setNumber":3,"reps":8,"weight":40}]},{"nameRaw":"Barbell Curl","unit":"lb","sets":[{"setNumber":1,"reps":11,"weight":40}]},{"nameRaw":"Reverse Curl","unit":"lb","sets":[{"setNumber":1,"reps":3,"weight":40}]}]}
{"date":"2025-09-18","exercises":[{"nameRaw":"Chest Press","unit":"lb","sets":[{"setNumber":1,"reps":15,"weight":100},{"setNumber":2,"reps":6,"weight":110},{"setNumber":3,"reps":7,"weight":100}]},{"nameRaw":"Tricep Pressdown","unit":"lb","sets":[{"setNumber":1,"reps":15,"weight":40},{"setNumber":2,"reps":8,"weight":45},{"setNumber":3,"reps":6,"weight":45},{"setNumber":4,"reps":6,"weight":40}]},{"nameRaw":"Pec Fly","unit":"lb","sets":[{"setNumber":1,"reps":15,"weight":90},{"setNumber":2,"reps":2,"weight":100},{"setNumber":3,"reps":3,"weight":90},{"setNumber":4,"reps":9,"weight":80}]},{"nameRaw":"Tricep Press","unit":"lb","sets":[{"setNumber":1,"reps":20,"weight":100},{"setNumber":2,"reps":10,"weight":130},{"setNumber":3,"reps":8,"weight":130}]}]}`;

export default function BulkWorkoutImportPage() {
  const [text, setText] = useState(example);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [newDefs, setNewDefs] = useState([]);
  const [editDefs, setEditDefs] = useState({});

  const parsePreview = () => {
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const sessions = lines.map((l) => JSON.parse(l));
      return { sessions, count: sessions.length };
    } catch (e) {
      return { sessions: [], count: 0, error: e.message };
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/workouts/bulk-import", text, {
        headers: { "Content-Type": "text/plain" },
      });
      setResult(res.data);
      if (Array.isArray(res.data?.createdDefinitions) && res.data.createdDefinitions.length) {
        setNewDefs(res.data.createdDefinitions);
        // seed editable copies
        const map = {};
        for (const d of res.data.createdDefinitions) {
          map[d._id] = {
            exerciseType: d.exerciseType || "Strength",
            muscleGroups: d.muscleGroups || [],
            equipment: d.equipment || [],
            defaultMetrics: (d.defaultMetrics?.length ? d.defaultMetrics : STRENGTH_PRESET).map((m) => ({ ...m })),
          };
        }
        setEditDefs(map);
      } else {
        setNewDefs([]);
        setEditDefs({});
      }
    } catch (e) {
      setError(e.response?.data?.message || "Import failed");
    }
    setSubmitting(false);
  };

  const preview = parsePreview();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Bulk Workout Import</h1>
      <Widget title="Paste JSON Lines">
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 rounded-lg border p-3 text-sm"
            style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
            placeholder="Paste one JSON object per line"
          />
          <div className="text-xs text-text-secondary">
            Preview: {preview.count} sessions {preview.error ? `- Error: ${preview.error}` : ""}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-primary text-white disabled:opacity-60"
            >
              {isSubmitting ? "Importing..." : "Import"}
            </button>
            <button
              onClick={() => setText(example)}
              className="px-4 py-2 rounded border"
              style={{ borderColor: "var(--color-primary)" }}
            >
              Load Example
            </button>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {result && <div className="text-sm">Imported {result.count} logs.</div>}
        </div>
      </Widget>

      {/* Preview Table */}
      {preview.sessions.length > 0 && !preview.error && (
        <Widget title="Preview">
          <div className="overflow-auto rounded-lg border" style={{ borderColor: "var(--color-primary)" }}>
            <table className="w-full text-xs">
              <thead className="bg-white/5">
                <tr className="text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Exercises</th>
                  <th className="p-2">Total Sets</th>
                  <th className="p-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {preview.sessions.map((s, idx) => {
                  const exs = Array.isArray(s.exercises) ? s.exercises : [];
                  const totalSets = exs.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
                  return (
                    <tr key={idx} className="odd:bg-white/0 even:bg-white/5">
                      <td className="p-2 whitespace-nowrap">{s.date || "(no date)"}</td>
                      <td className="p-2">{exs.length}</td>
                      <td className="p-2">{totalSets}</td>
                      <td className="p-2">
                        <details>
                          <summary className="cursor-pointer text-text-secondary">View</summary>
                          <div className="mt-2 space-y-1">
                            {exs.map((ex, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="truncate pr-2 text-text-main">
                                  {ex.nameRaw || ex.name || "(unnamed)"}
                                </div>
                                <div className="text-text-secondary">
                                  {Array.isArray(ex.sets) ? ex.sets.length : 0} sets
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Widget>
      )}

      {/* Prompt for new exercises if any were created */}
      {result?.data?.length > 0 && (
        <Widget title="Imported Workouts">
          <div className="overflow-auto rounded-lg border" style={{ borderColor: "var(--color-primary)" }}>
            <table className="w-full text-xs">
              <thead className="bg-white/5">
                <tr className="text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Exercises</th>
                  <th className="p-2">Total Sets</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((log) => {
                  const exs = Array.isArray(log.exercises) ? log.exercises : [];
                  const totalSets = exs.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
                  return (
                    <tr key={log._id} className="odd:bg-white/0 even:bg-white/5">
                      <td className="p-2 whitespace-nowrap">{new Date(log.date).toISOString().slice(0, 10)}</td>
                      <td className="p-2">{log.workoutName || "Imported Workout"}</td>
                      <td className="p-2">
                        <details>
                          <summary className="cursor-pointer text-text-secondary">{exs.length} exercises</summary>
                          <div className="mt-2 space-y-1">
                            {exs.map((ex, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="truncate pr-2 text-text-main">
                                  {ex.exerciseDefinition?.name || "(unknown)"}
                                </div>
                                <div className="text-text-secondary">
                                  {Array.isArray(ex.sets) ? ex.sets.length : 0} sets
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                      <td className="p-2">{totalSets}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Widget>
      )}

      {/* Prompt for new exercises if any were created */}
      {newDefs.length > 0 && (
        <Widget title={`Define ${newDefs.length} New Exercise${newDefs.length > 1 ? "s" : ""}`}>
          <div className="space-y-4">
            {newDefs.map((d) => {
              const form = editDefs[d._id] || {};
              const setForm = (patch) => setEditDefs((prev) => ({ ...prev, [d._id]: { ...prev[d._id], ...patch } }));
              const onTypeChange = (val) => {
                let preset = STRENGTH_PRESET;
                if (val === "Cardio") preset = CARDIO_PRESET;
                if (val === "Flexibility") preset = FLEX_PRESET;
                setForm({ exerciseType: val, defaultMetrics: preset.map((m) => ({ ...m })) });
              };
              const toggleInArray = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
              const saveOne = async () => {
                try {
                  await api.put(`/admin/exercises/${d._id}`, {
                    name: d.name,
                    description: d.description || "",
                    exerciseType: form.exerciseType,
                    muscleGroups: form.muscleGroups,
                    equipment: form.equipment,
                    defaultMetrics: form.defaultMetrics,
                  });
                } catch (e) {
                  alert(e.response?.data?.message || "Failed to update exercise");
                }
              };
              return (
                <div key={d._id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-primary)" }}>
                  <div className="mb-2">
                    <div className="text-sm font-semibold text-text-main">{d.name}</div>
                    <div className="text-xs text-text-secondary">
                      Select type, muscle groups, equipment, and metrics.
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Type */}
                    <div>
                      <label className="text-xs text-text-secondary">Type</label>
                      <select
                        value={form.exerciseType}
                        onChange={(e) => onTypeChange(e.target.value)}
                        className="w-full mt-1 rounded border px-2 py-1 text-sm"
                        style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                      >
                        {EXERCISE_TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Muscle Groups */}
                    <div>
                      <label className="text-xs text-text-secondary">Muscle Groups</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {MUSCLE_GROUP_OPTIONS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setForm({ muscleGroups: toggleInArray(form.muscleGroups || [], m) })}
                            className={`px-2 py-1 rounded border text-xs ${
                              form.muscleGroups?.includes(m) ? "bg-primary text-white" : ""
                            }`}
                            style={{ borderColor: "var(--color-primary)" }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Equipment */}
                    <div className="md:col-span-2">
                      <label className="text-xs text-text-secondary">Equipment</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setForm({ equipment: toggleInArray(form.equipment || [], m) })}
                            className={`px-2 py-1 rounded border text-xs ${
                              form.equipment?.includes(m) ? "bg-primary text-white" : ""
                            }`}
                            style={{ borderColor: "var(--color-primary)" }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Metrics */}
                  <div className="mt-3">
                    <label className="text-xs text-text-secondary">Metrics</label>
                    <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      {(form.defaultMetrics || []).map((metric, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={metric.name}
                            onChange={(e) => {
                              const copy = [...(form.defaultMetrics || [])];
                              copy[i] = { ...copy[i], name: e.target.value };
                              setForm({ defaultMetrics: copy });
                            }}
                            placeholder="name"
                            className="flex-1 rounded border px-2 py-1 text-sm"
                            style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                          />
                          <input
                            value={metric.unit}
                            onChange={(e) => {
                              const copy = [...(form.defaultMetrics || [])];
                              copy[i] = { ...copy[i], unit: e.target.value };
                              setForm({ defaultMetrics: copy });
                            }}
                            placeholder="unit"
                            className="w-28 rounded border px-2 py-1 text-sm"
                            style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={saveOne} className="px-3 py-1 rounded bg-primary text-white text-sm">
                      Save Exercise
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={async () => {
                for (const d of newDefs) {
                  const form = editDefs[d._id];
                  if (!form) continue;
                  try {
                    await api.put(`/admin/exercises/${d._id}`, {
                      name: d.name,
                      description: d.description || "",
                      exerciseType: form.exerciseType,
                      muscleGroups: form.muscleGroups,
                      equipment: form.equipment,
                      defaultMetrics: form.defaultMetrics,
                    });
                  } catch (e) {
                    console.error("Failed to update", d.name, e.response?.data?.message || e.message);
                  }
                }
                alert("Saved all new exercises.");
              }}
              className="px-4 py-2 rounded border text-sm"
              style={{ borderColor: "var(--color-primary)" }}
            >
              Save All New Exercises
            </button>
          </div>
        </Widget>
      )}
    </div>
  );
}
