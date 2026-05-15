// src/pages/AdminExercisesPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Copy,
  Dumbbell,
  Edit3,
  HeartPulse,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api";
import {
  CARDIO_PRESET,
  EQUIPMENT_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  FLEX_PRESET,
  MUSCLE_GROUP_OPTIONS,
  STRENGTH_PRESET,
} from "../constants/exerciseOptions";

const TYPE_CONFIG = {
  Strength: {
    icon: Dumbbell,
    title: "Strength",
    examples: "Presses, rows, curls",
    preset: STRENGTH_PRESET,
  },
  Cardio: {
    icon: Activity,
    title: "Cardio",
    examples: "Runs, bike, treadmill",
    preset: CARDIO_PRESET,
  },
  Flexibility: {
    icon: HeartPulse,
    title: "Flexibility",
    examples: "Mobility, stretching",
    preset: FLEX_PRESET,
  },
};

const createInitialFormState = () => ({
  name: "",
  description: "",
  exerciseType: "Strength",
  muscleGroups: [],
  equipment: [],
  defaultMetrics: STRENGTH_PRESET.map((metric) => ({ ...metric })),
});

const cloneMetrics = (metrics) => metrics.map((metric) => ({ ...metric }));

const AdminExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [formData, setFormData] = useState(createInitialFormState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [touchedMetrics, setTouchedMetrics] = useState(false);

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/exercises");
      setExercises(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch exercises.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesSearch =
        !term ||
        exercise.name.toLowerCase().includes(term) ||
        exercise.muscleGroups?.some((group) => group.toLowerCase().includes(term)) ||
        exercise.equipment?.some((item) => item.toLowerCase().includes(term));
      const matchesType = typeFilter === "All" || exercise.exerciseType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [exercises, search, typeFilter]);

  const countsByType = useMemo(() => {
    return exercises.reduce(
      (totals, exercise) => ({
        ...totals,
        [exercise.exerciseType]: (totals[exercise.exerciseType] || 0) + 1,
      }),
      { All: exercises.length }
    );
  }, [exercises]);

  const metricNames = formData.defaultMetrics.map((metric) => metric.name.trim().toLowerCase()).filter(Boolean);
  const hasDuplicateMetricNames = new Set(metricNames).size !== metricNames.length;
  const metricsAreValid =
    formData.defaultMetrics.length > 0 &&
    formData.defaultMetrics.every((metric) => metric.name.trim() && metric.unit.trim()) &&
    !hasDuplicateMetricNames;
  const canSave = formData.name.trim() && metricsAreValid && !saving;

  const resetForm = () => {
    setFormData(createInitialFormState());
    setEditingId(null);
    setTouchedMetrics(false);
    setError("");
    setSuccess("");
  };

  const setExerciseType = (exerciseType, forcePreset = false) => {
    setFormData((prev) => ({
      ...prev,
      exerciseType,
      defaultMetrics:
        forcePreset || !touchedMetrics ? cloneMetrics(TYPE_CONFIG[exerciseType].preset) : prev.defaultMetrics,
    }));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    if (name === "exerciseType") {
      setExerciseType(value);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayValue = (field, value) => {
    setFormData((prev) => {
      const values = prev[field];
      return {
        ...prev,
        [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  };

  const applyPreset = (exerciseType) => {
    setTouchedMetrics(true);
    setFormData((prev) => ({
      ...prev,
      exerciseType,
      defaultMetrics: cloneMetrics(TYPE_CONFIG[exerciseType].preset),
    }));
  };

  const updateMetric = (index, field, value) => {
    setTouchedMetrics(true);
    setFormData((prev) => ({
      ...prev,
      defaultMetrics: prev.defaultMetrics.map((metric, metricIndex) =>
        metricIndex === index ? { ...metric, [field]: value } : metric
      ),
    }));
  };

  const addMetric = () => {
    setTouchedMetrics(true);
    setFormData((prev) => ({
      ...prev,
      defaultMetrics: [...prev.defaultMetrics, { name: "", unit: "" }],
    }));
  };

  const removeMetric = (index) => {
    setTouchedMetrics(true);
    setFormData((prev) => ({
      ...prev,
      defaultMetrics: prev.defaultMetrics.filter((_, metricIndex) => metricIndex !== index),
    }));
  };

  const loadExercise = (exercise) => {
    setEditingId(exercise._id);
    setTouchedMetrics(false);
    setError("");
    setSuccess("");
    setFormData({
      name: exercise.name || "",
      description: exercise.description || "",
      exerciseType: exercise.exerciseType || "Strength",
      muscleGroups: exercise.muscleGroups || [],
      equipment: exercise.equipment || [],
      defaultMetrics: exercise.defaultMetrics?.length
        ? cloneMetrics(exercise.defaultMetrics)
        : cloneMetrics(STRENGTH_PRESET),
    });
  };

  const duplicateExercise = (exercise) => {
    setEditingId(null);
    setTouchedMetrics(false);
    setError("");
    setSuccess("");
    setFormData({
      name: `${exercise.name} Variation`,
      description: exercise.description || "",
      exerciseType: exercise.exerciseType || "Strength",
      muscleGroups: exercise.muscleGroups || [],
      equipment: exercise.equipment || [],
      defaultMetrics: exercise.defaultMetrics?.length
        ? cloneMetrics(exercise.defaultMetrics)
        : cloneMetrics(STRENGTH_PRESET),
    });
  };

  const saveExercise = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!canSave) {
      setError("Add a name and complete each metric row with unique names and units.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/exercises/${editingId}`, formData);
        setSuccess("Exercise updated.");
      } else {
        await api.post("/admin/exercises", formData);
        setSuccess("Exercise created.");
      }
      resetForm();
      await fetchExercises();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save exercise.");
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = async (exercise) => {
    if (!window.confirm(`Delete ${exercise.name}?`)) return;

    try {
      await api.delete(`/admin/exercises/${exercise._id}`);
      if (editingId === exercise._id) resetForm();
      await fetchExercises();
    } catch (err) {
      setError("Failed to delete exercise.");
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 pb-20 md:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Exercise Definitions</p>
          <h1 className="text-2xl font-bold text-white">Exercise Builder</h1>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          New Exercise
        </button>
      </header>

      {(error || success) && (
        <div
          className={`rounded-md border p-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0">
          <form onSubmit={saveExercise} className="space-y-5 rounded-lg border border-white/10 bg-surface/80 p-4">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{editingId ? "Edit Exercise" : "Add Exercise"}</h2>
                <p className="text-xs text-text-secondary">{formData.exerciseType}</p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-text-secondary transition hover:border-primary/60 hover:text-primary"
                  title="Cancel editing"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Exercise Name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Chest Press"
                  className="mt-2 min-h-12 w-full rounded-md border border-white/10 bg-background px-3 text-lg font-semibold text-white outline-none transition placeholder:text-text-tertiary focus:border-primary"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Type</span>
                <select
                  name="exerciseType"
                  value={formData.exerciseType}
                  onChange={handleFormChange}
                  className="mt-2 min-h-12 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-white outline-none transition focus:border-primary"
                >
                  {EXERCISE_TYPE_OPTIONS.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              {EXERCISE_TYPE_OPTIONS.map((type) => {
                const config = TYPE_CONFIG[type];
                const Icon = config.icon;
                const active = formData.exerciseType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExerciseType(type, true)}
                    className={`rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/15"
                        : "border-white/10 bg-white/5 hover:border-primary/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className={active ? "h-5 w-5 text-primary" : "h-5 w-5 text-text-tertiary"} />
                      {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-white">{config.title}</div>
                    <div className="mt-1 text-xs text-text-secondary">{config.examples}</div>
                  </button>
                );
              })}
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <ChipSection
                title="Muscle Groups"
                options={MUSCLE_GROUP_OPTIONS}
                selected={formData.muscleGroups}
                onToggle={(value) => toggleArrayValue("muscleGroups", value)}
              />
              <ChipSection
                title="Equipment"
                options={EQUIPMENT_OPTIONS}
                selected={formData.equipment}
                onToggle={(value) => toggleArrayValue("equipment", value)}
              />
            </section>

            <section className="rounded-lg border border-white/10 bg-background/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Metrics</h3>
                  <p className="text-xs text-text-tertiary">{formData.defaultMetrics.length} tracked</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {EXERCISE_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => applyPreset(type)}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-primary/60 hover:text-primary"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {formData.defaultMetrics.map((metric, index) => {
                  const duplicate =
                    metric.name &&
                    formData.defaultMetrics.filter(
                      (item) => item.name.trim().toLowerCase() === metric.name.trim().toLowerCase()
                    ).length > 1;

                  return (
                    <div key={index} className="grid grid-cols-[minmax(0,1fr)_110px_36px] gap-2">
                      <input
                        value={metric.name}
                        onChange={(event) => updateMetric(index, "name", event.target.value)}
                        placeholder="metric"
                        className={`min-h-10 rounded-md border bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-text-tertiary focus:border-primary ${
                          duplicate ? "border-red-500/70" : "border-white/10"
                        }`}
                      />
                      <input
                        value={metric.unit}
                        onChange={(event) => updateMetric(index, "unit", event.target.value)}
                        placeholder="unit"
                        className="min-h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-text-tertiary focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => removeMetric(index)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition hover:bg-red-500/10 hover:text-red-300"
                        title="Remove metric"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addMetric}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-primary/60 hover:text-primary"
              >
                <Plus size={14} />
                Add Metric
              </button>
            </section>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Notes</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Seat height, grip, setup cues"
                className="mt-2 h-24 w-full resize-none rounded-md border border-white/10 bg-background p-3 text-sm text-white outline-none transition placeholder:text-text-tertiary focus:border-primary"
              />
            </label>

            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <DefinitionSummary formData={formData} metricsAreValid={metricsAreValid} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary/60 hover:text-primary"
                >
                  <RefreshCcw size={16} />
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving" : editingId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </form>
        </main>

        <aside className="min-w-0 space-y-5">
          <section className="rounded-lg border border-white/10 bg-surface/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Library</h2>
              <span className="rounded bg-white/10 px-2 py-1 text-xs text-text-secondary">
                {filteredExercises.length}
              </span>
            </div>

            <label className="mt-4 flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-background px-3">
              <Search size={16} className="text-text-tertiary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search exercises"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-text-tertiary"
              />
            </label>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {["All", ...EXERCISE_TYPE_OPTIONS].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-md px-2 py-2 text-xs font-semibold transition ${
                    typeFilter === type ? "bg-primary text-white" : "bg-white/5 text-text-secondary hover:bg-white/10"
                  }`}
                >
                  {type === "All" ? countsByType.All : countsByType[type] || 0}
                  <span className="sr-only"> {type}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="rounded-md border border-white/10 p-4 text-sm text-text-secondary">Loading...</div>
              ) : (
                filteredExercises.map((exercise) => (
                  <article
                    key={exercise._id}
                    className={`rounded-md border p-3 transition ${
                      editingId === exercise._id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{exercise.name}</h3>
                        <p className="mt-1 text-xs text-text-tertiary">{exercise.exerciseType}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => loadExercise(exercise)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition hover:bg-white/10 hover:text-primary"
                          title="Edit exercise"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateExercise(exercise)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition hover:bg-white/10 hover:text-primary"
                          title="Duplicate exercise"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExercise(exercise)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition hover:bg-red-500/10 hover:text-red-300"
                          title="Delete exercise"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {exercise.muscleGroups?.slice(0, 3).map((group) => (
                        <span key={group} className="rounded bg-white/10 px-2 py-1 text-[10px] text-text-secondary">
                          {group}
                        </span>
                      ))}
                    </div>
                  </article>
                ))
              )}

              {!loading && !filteredExercises.length && (
                <div className="rounded-md border border-dashed border-white/15 p-4 text-sm text-text-secondary">
                  No exercises found.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

const ChipSection = ({ title, options, selected, onToggle }) => (
  <section>
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
      <span className="text-xs text-text-tertiary">{selected.length}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            type="button"
            key={option}
            onClick={() => onToggle(option)}
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-text-secondary hover:border-primary/60 hover:text-primary"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  </section>
);

const DefinitionSummary = ({ formData, metricsAreValid }) => (
  <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
          formData.name.trim() ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-text-tertiary"
        }`}
      >
        <CheckCircle2 size={13} />
        Name
      </span>
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
          metricsAreValid ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-text-tertiary"
        }`}
      >
        <CheckCircle2 size={13} />
        Metrics
      </span>
      <span className="rounded bg-white/10 px-2 py-1 text-xs text-text-secondary">
        {formData.muscleGroups.length} muscles
      </span>
      <span className="rounded bg-white/10 px-2 py-1 text-xs text-text-secondary">
        {formData.equipment.length} equipment
      </span>
    </div>
  </div>
);

export default AdminExercisesPage;
