// src/pages/WorkoutPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Dumbbell,
  History,
  ListChecks,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import api from "../services/api";

const FILTERS = ["All", "Strength", "Cardio", "Bodyweight"];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const toInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const isBodyweight = (exercise = {}) => exercise.equipment?.includes("Bodyweight");

const isTimedExercise = (exercise = {}) =>
  exercise.exerciseType === "Cardio" ||
  exercise.exerciseType === "Flexibility" ||
  exercise.defaultMetrics?.some((metric) =>
    ["duration", "time", "minutes"].some((key) => metric.name?.toLowerCase().includes(key))
  );

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const normalizeExercise = (exercise = {}) => ({
  exerciseDefinition: exercise._id,
  name: exercise.name || "Exercise",
  exerciseType: exercise.exerciseType || "Strength",
  muscleGroups: exercise.muscleGroups || [],
  equipment: exercise.equipment || [],
  defaultMetrics: exercise.defaultMetrics || [],
  sets: [],
  completed: false,
});

const WorkoutPage = () => {
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("start");
  const [sessionMode, setSessionMode] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [sessionExercises, setSessionExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [setReps, setSetReps] = useState("");
  const [setWeight, setSetWeight] = useState("");
  const [setMinutes, setSetMinutes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPageData = useCallback(async () => {
    setError("");
    try {
      const [logsRes, templatesRes, exercisesRes] = await Promise.all([
        api.get("/workouts"),
        api.get("/workout-templates"),
        api.get("/exercises"),
      ]);

      setLogs(logsRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
      setExercises(exercisesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load workouts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const currentExercise = sessionExercises[currentExerciseIndex];
  const currentExerciseIsTimed = currentExercise ? isTimedExercise(currentExercise) : false;

  const sessionStats = useMemo(() => {
    return sessionExercises.reduce(
      (totals, exercise) => {
        const reps = exercise.sets.reduce((sum, set) => sum + (toInteger(set.reps) || 0), 0);
        const minutes = exercise.sets.reduce((sum, set) => sum + (toNumber(set.durationExerciseMinutes) || 0), 0);

        return {
          totalExercises: totals.totalExercises + 1,
          completedExercises: totals.completedExercises + (exercise.completed ? 1 : 0),
          sets: totals.sets + exercise.sets.length,
          reps: totals.reps + reps,
          minutes: totals.minutes + minutes,
        };
      },
      { totalExercises: 0, completedExercises: 0, sets: 0, reps: 0, minutes: 0 }
    );
  }, [sessionExercises]);

  const hasLoggableWork = useMemo(
    () =>
      sessionExercises.some((exercise) =>
        exercise.sets.some((set) => toInteger(set.reps) || toNumber(set.durationExerciseMinutes))
      ),
    [sessionExercises]
  );

  const filteredExercises = useMemo(() => {
    const search = exerciseSearch.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesSearch =
        !search ||
        exercise.name.toLowerCase().includes(search) ||
        exercise.muscleGroups?.some((group) => group.toLowerCase().includes(search));
      const matchesFilter =
        filter === "All" ||
        exercise.exerciseType === filter ||
        (filter === "Bodyweight" && isBodyweight(exercise));

      return matchesSearch && matchesFilter;
    });
  }, [exerciseSearch, exercises, filter]);

  const clearSetInputs = () => {
    setSetReps("");
    setSetWeight("");
    setSetMinutes("");
  };

  const resetSession = () => {
    setView("start");
    setSessionMode("");
    setActiveTemplateId("");
    setSessionName("");
    setDurationMinutes("");
    setNotes("");
    setSessionExercises([]);
    setCurrentExerciseIndex(0);
    setExerciseSearch("");
    setFilter("All");
    clearSetInputs();
  };

  const showTemplatePicker = () => {
    setSuccess("");
    setError("");
    setView("templates");
  };

  const showCustomPicker = () => {
    setSuccess("");
    setError("");
    setSessionMode("custom");
    if (!sessionName.trim()) setSessionName("Custom Workout");
    setView("custom-pick");
  };

  const startTemplate = (template) => {
    setSuccess("");
    setError("");
    setSessionMode("template");
    setActiveTemplateId(template._id);
    setSessionName(template.name);
    setSessionExercises(template.exercises.map(normalizeExercise));
    setCurrentExerciseIndex(0);
    clearSetInputs();
    setView("active");
  };

  const chooseCustomExercise = (exercise) => {
    setSuccess("");
    setError("");
    setSessionMode("custom");
    if (!sessionName.trim()) setSessionName("Custom Workout");
    setSessionExercises((current) => {
      const next = [...current, normalizeExercise(exercise)];
      setCurrentExerciseIndex(next.length - 1);
      return next;
    });
    setExerciseSearch("");
    clearSetInputs();
    setView("active");
  };

  const addSetToCurrentExercise = () => {
    if (!currentExercise) return;

    const reps = toInteger(setReps);
    const minutes = toNumber(setMinutes);
    const weight = toNumber(setWeight);

    if (currentExerciseIsTimed) {
      if (!minutes) {
        setError("Enter minutes for this set.");
        return;
      }
    } else if (!reps) {
      setError("Enter reps for this set.");
      return;
    }

    setError("");
    setSessionExercises((current) =>
      current.map((exercise, index) => {
        if (index !== currentExerciseIndex) return exercise;

        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              reps: reps || 0,
              weight: weight || 0,
              weightUnit: isBodyweight(exercise) ? "bodyweight" : "lbs",
              durationExerciseMinutes: minutes || undefined,
            },
          ],
        };
      })
    );
    clearSetInputs();
  };

  const removeSet = (setIndex) => {
    setSessionExercises((current) =>
      current.map((exercise, index) => {
        if (index !== currentExerciseIndex) return exercise;
        return { ...exercise, sets: exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex) };
      })
    );
  };

  const goToExercise = (exerciseIndex) => {
    setCurrentExerciseIndex(exerciseIndex);
    clearSetInputs();
    setView("active");
  };

  const completeCurrentExercise = () => {
    if (!currentExercise) return;
    if (!currentExercise.sets.length) {
      setError("Log at least one set before completing this exercise.");
      return;
    }

    setError("");

    setSessionExercises((current) =>
      current.map((exercise, index) =>
        index === currentExerciseIndex ? { ...exercise, completed: true } : exercise
      )
    );

    if (sessionMode === "template") {
      const nextIndex = sessionExercises.findIndex(
        (exercise, index) => index > currentExerciseIndex && !exercise.completed
      );

      if (nextIndex !== -1) {
        setCurrentExerciseIndex(nextIndex);
        clearSetInputs();
        return;
      }
    }

    if (sessionMode === "custom") {
      clearSetInputs();
      setView("custom-pick");
      return;
    }

    clearSetInputs();
  };

  const buildPayload = () => {
    const completedExercises = sessionExercises
      .map((exercise) => {
        const sets = exercise.sets
          .filter((set) => toInteger(set.reps) || toNumber(set.weight))
          .map((set) => ({
            reps: toInteger(set.reps) || 0,
            weight: toNumber(set.weight) || 0,
            weightUnit: isBodyweight(exercise) ? "bodyweight" : "lbs",
          }));
        const minutes = exercise.sets.reduce((sum, set) => sum + (toNumber(set.durationExerciseMinutes) || 0), 0);

        if (!sets.length && !minutes) return null;

        return {
          exerciseDefinition: exercise.exerciseDefinition,
          sets,
          durationExerciseMinutes: minutes || undefined,
        };
      })
      .filter(Boolean);

    return {
      date: new Date().toISOString(),
      workoutName: sessionName.trim() || "Workout Session",
      durationSessionMinutes: toInteger(durationMinutes) || sessionStats.minutes || undefined,
      exercises: completedExercises,
      notesSession: notes.trim() || undefined,
    };
  };

  const saveWorkout = async () => {
    setError("");
    setSuccess("");

    if (!hasLoggableWork) {
      setError("Log at least one set before completing the session.");
      return;
    }

    const payload = buildPayload();
    if (!payload.exercises.length) {
      setError("Log at least one set before completing the session.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/workouts", payload);
      setSuccess(response.data.message || "Workout logged.");
      resetSession();
      await fetchPageData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save workout.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center pb-20 md:pb-0">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const completedAllTemplateExercises =
    sessionMode === "template" &&
    sessionExercises.length > 0 &&
    sessionExercises.every((exercise) => exercise.completed || exercise.sets.length > 0);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-28 md:pb-8">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Workout Runner</p>
          <h1 className="truncate text-2xl font-bold text-white">
            {view === "active" ? sessionName || "Workout Session" : "Start a Workout"}
          </h1>
        </div>
        <Link
          to="/admin/templates"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-text-secondary transition hover:border-primary/70 hover:text-primary"
          title="Manage templates"
        >
          <Settings2 size={18} />
        </Link>
      </header>

      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {success && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {view === "start" && (
        <>
          <section className="rounded-lg border border-white/10 bg-surface/80 p-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Dumbbell size={24} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-white">What are we starting?</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Pick a saved routine for a guided order, or build a custom workout one exercise at a time.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={showTemplatePicker}
                className="flex min-h-28 items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/15 p-4 text-left transition hover:bg-primary/20"
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-lg font-semibold text-white">
                    <ListChecks size={20} />
                    Use Template
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">Follow chest day, leg day, or any saved routine in order.</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
              </button>

              <button
                type="button"
                onClick={showCustomPicker}
                className="flex min-h-28 items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4 text-left transition hover:border-primary/60 hover:bg-white/[0.07]"
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-lg font-semibold text-white">
                    <Plus size={20} />
                    Custom Workout
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">Choose your first exercise now, then decide what comes next.</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary" />
              </button>
            </div>
          </section>

          <RecentWorkouts logs={logs} />
        </>
      )}

      {view === "templates" && (
        <section className="rounded-lg border border-white/10 bg-surface/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setView("start")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <Link to="/admin/templates" className="text-xs font-semibold text-primary hover:opacity-80">
              Customize
            </Link>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold text-white">Choose a template</h2>
            <p className="mt-1 text-sm text-text-secondary">The workout will guide you through each exercise in order.</p>
          </div>

          <div className="mt-5 grid gap-3">
            {templates.map((template) => (
              <button
                key={template._id}
                type="button"
                onClick={() => startTemplate(template)}
                className={`rounded-lg border p-4 text-left transition ${
                  activeTemplateId === template._id
                    ? "border-primary bg-primary/15"
                    : "border-white/10 bg-white/5 hover:border-primary/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    <p className="mt-1 text-xs text-text-tertiary">{template.exercises.length} exercises</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white">
                    Start
                  </span>
                </div>

                <ol className="mt-4 space-y-2">
                  {template.exercises.map((exercise, index) => (
                    <li key={exercise._id} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white">
                        {index + 1}
                      </span>
                      <span className="truncate">{exercise.name}</span>
                    </li>
                  ))}
                </ol>
              </button>
            ))}

            {!templates.length && (
              <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm text-text-secondary">
                No templates yet. Create one from Workout Templates.
              </div>
            )}
          </div>
        </section>
      )}

      {view === "custom-pick" && (
        <ExercisePicker
          title={sessionExercises.length ? "What exercise is next?" : "Choose your first exercise"}
          subtitle={
            sessionExercises.length
              ? "Add another exercise, or finish the session if you are done."
              : "Pick an exercise to start logging your custom workout."
          }
          filter={filter}
          filters={FILTERS}
          onFilterChange={setFilter}
          search={exerciseSearch}
          onSearchChange={setExerciseSearch}
          exercises={filteredExercises}
          onChooseExercise={chooseCustomExercise}
          onBack={() => (sessionExercises.length ? setView("active") : setView("start"))}
          onFinish={saveWorkout}
          canFinish={hasLoggableWork}
          saving={saving}
        />
      )}

      {view === "active" && currentExercise && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <main className="space-y-5">
            <section className="rounded-lg border border-white/10 bg-surface/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-text-tertiary">
                    {sessionMode === "template"
                      ? `Exercise ${currentExerciseIndex + 1} of ${sessionExercises.length}`
                      : "Current exercise"}
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-white">{currentExercise.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
                      {isBodyweight(currentExercise) ? "Bodyweight" : currentExercise.exerciseType}
                    </span>
                    {currentExercise.muscleGroups.slice(0, 3).map((group) => (
                      <span key={group} className="rounded bg-white/10 px-2 py-1 text-xs text-text-secondary">
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setView(sessionMode === "template" ? "templates" : "custom-pick")}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-text-tertiary transition hover:border-primary/60 hover:text-primary"
                  title="Back"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-background/70 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Log one set</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  {currentExerciseIsTimed ? (
                    <label>
                      <span className="text-xs text-text-tertiary">Minutes completed</span>
                      <input
                        value={setMinutes}
                        onChange={(event) => setSetMinutes(event.target.value)}
                        inputMode="decimal"
                        placeholder="12"
                        className="mt-1 h-12 w-full rounded-md border border-white/10 bg-black/20 px-3 text-lg font-semibold text-white outline-none transition focus:border-primary"
                      />
                    </label>
                  ) : (
                    <label>
                      <span className="text-xs text-text-tertiary">Reps completed</span>
                      <input
                        value={setReps}
                        onChange={(event) => setSetReps(event.target.value)}
                        inputMode="numeric"
                        placeholder="10"
                        className="mt-1 h-12 w-full rounded-md border border-white/10 bg-black/20 px-3 text-lg font-semibold text-white outline-none transition focus:border-primary"
                      />
                    </label>
                  )}

                  {!currentExerciseIsTimed && (
                    <label>
                      <span className="text-xs text-text-tertiary">
                        {isBodyweight(currentExercise) ? "Bodyweight" : "Weight optional"}
                      </span>
                      {isBodyweight(currentExercise) ? (
                        <div className="mt-1 flex h-12 w-full items-center rounded-md border border-white/10 bg-black/20 px-3 text-sm font-semibold text-text-secondary">
                          BW
                        </div>
                      ) : (
                        <input
                          value={setWeight}
                          onChange={(event) => setSetWeight(event.target.value)}
                          inputMode="decimal"
                          placeholder="Lbs"
                          className="mt-1 h-12 w-full rounded-md border border-white/10 bg-black/20 px-3 text-lg font-semibold text-white outline-none transition focus:border-primary"
                        />
                      )}
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={addSetToCurrentExercise}
                    className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <Plus size={16} />
                    Add Set
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {currentExercise.sets.map((set, index) => (
                  <div
                    key={`${currentExercise.exerciseDefinition}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-semibold text-emerald-200">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">
                          {set.durationExerciseMinutes
                            ? `${set.durationExerciseMinutes} min`
                            : `${set.reps} reps${set.weight ? ` at ${set.weight} lbs` : ""}`}
                        </div>
                        <div className="text-xs text-text-tertiary">Logged set</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSet(index)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-tertiary transition hover:bg-red-500/10 hover:text-red-300"
                      title="Remove set"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {!currentExercise.sets.length && (
                  <div className="rounded-md border border-dashed border-white/15 p-4 text-sm text-text-secondary">
                    Add your first completed set above.
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={completeCurrentExercise}
                  disabled={!currentExercise.sets.length}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={17} />
                  {sessionMode === "custom" ? "Exercise Done - Choose Next" : "Exercise Done"}
                </button>
                <button
                  type="button"
                  onClick={saveWorkout}
                  disabled={saving || !hasLoggableWork}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving" : completedAllTemplateExercises ? "Complete Session" : "Finish Session"}
                </button>
              </div>
            </section>

            {sessionMode === "custom" && currentExercise.completed && (
              <button
                type="button"
                onClick={showCustomPicker}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/15 p-4 text-left transition hover:bg-primary/20"
              >
                <div>
                  <div className="text-sm font-semibold text-white">What is next?</div>
                  <div className="text-xs text-text-secondary">Choose another exercise or finish the session.</div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
            )}
          </main>

          <aside className="space-y-5">
            <section className="rounded-lg border border-white/10 bg-surface/80 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Session</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MiniStat label="Exercises" value={`${sessionStats.completedExercises}/${sessionStats.totalExercises}`} />
                <MiniStat label="Sets" value={sessionStats.sets} />
                <MiniStat label="Reps" value={sessionStats.reps} />
                <MiniStat label="Minutes" value={sessionStats.minutes || durationMinutes || 0} />
              </div>

              <div className="mt-4 grid gap-2">
                <input
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Session minutes"
                  className="min-h-11 rounded-md border border-white/10 bg-background px-3 text-sm text-white outline-none transition focus:border-primary"
                />
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Session notes"
                  className="h-20 resize-none rounded-md border border-white/10 bg-background p-3 text-sm text-white outline-none transition focus:border-primary"
                />
              </div>
            </section>

            {sessionMode === "template" && (
              <section className="rounded-lg border border-white/10 bg-surface/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Template Order</h3>
                <div className="mt-3 space-y-2">
                  {sessionExercises.map((exercise, index) => {
                    const active = index === currentExerciseIndex;
                    return (
                      <button
                        key={`${exercise.exerciseDefinition}-${index}`}
                        type="button"
                        onClick={() => goToExercise(index)}
                        className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition ${
                          active
                            ? "border-primary bg-primary/15"
                            : "border-white/10 bg-white/5 hover:border-primary/50"
                        }`}
                      >
                        {exercise.completed ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                        ) : active ? (
                          <Circle className="h-5 w-5 shrink-0 text-primary" />
                        ) : (
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] text-text-secondary">
                            {index + 1}
                          </span>
                        )}
                        <span className="min-w-0 truncate text-sm text-white">{exercise.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}

      {view === "active" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-text-tertiary">Session</div>
              <div className="truncate text-sm font-semibold text-white">
                {sessionStats.sets} sets - {sessionStats.reps || sessionStats.minutes}{" "}
                {sessionStats.reps ? "reps" : "min"}
              </div>
            </div>
            <button
              type="button"
              onClick={saveWorkout}
              disabled={saving || !hasLoggableWork}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ label, value }) => (
  <div className="rounded-md border border-white/10 bg-white/5 p-3">
    <div className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</div>
    <div className="mt-1 text-lg font-semibold text-white">{value}</div>
  </div>
);

const ExercisePicker = ({
  title,
  subtitle,
  filter,
  filters,
  onFilterChange,
  search,
  onSearchChange,
  exercises,
  onChooseExercise,
  onBack,
  onFinish,
  canFinish,
  saving,
}) => (
  <section className="rounded-lg border border-white/10 bg-surface/80 p-4">
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      {canFinish && (
        <button
          type="button"
          onClick={onFinish}
          disabled={saving}
          className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving" : "Finish Session"}
        </button>
      )}
    </div>

    <div className="mt-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
    </div>

    <label className="mt-5 flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-background px-3">
      <Search size={16} className="text-text-tertiary" />
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search exercises"
        className="w-full bg-transparent text-sm text-white outline-none"
      />
    </label>

    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {filters.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onFilterChange(item)}
          className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition ${
            filter === item ? "bg-primary text-white" : "bg-white/5 text-text-secondary hover:bg-white/10"
          }`}
        >
          {item}
        </button>
      ))}
    </div>

    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {exercises.slice(0, 20).map((exercise) => (
        <button
          key={exercise._id}
          type="button"
          onClick={() => onChooseExercise(exercise)}
          className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 p-3 text-left transition hover:border-primary/60 hover:bg-white/[0.07]"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">{exercise.name}</div>
            <div className="truncate text-xs text-text-tertiary">
              {exercise.muscleGroups?.slice(0, 2).join(", ") || exercise.exerciseType}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
        </button>
      ))}

      {!exercises.length && (
        <div className="rounded-md border border-dashed border-white/15 p-4 text-sm text-text-secondary">
          No exercises found.
        </div>
      )}
    </div>
  </section>
);

const RecentWorkouts = ({ logs }) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
      <History size={16} />
      Recent Workouts
    </div>
    <div className="grid gap-2">
      {logs.slice(0, 3).map((log) => {
        const setCount = log.exercises?.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0) || 0;

        return (
          <div key={log._id} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">{log.workoutName}</h3>
                <p className="text-xs text-text-tertiary">{formatDate(log.date)}</p>
              </div>
              <div className="inline-flex shrink-0 items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs text-text-secondary">
                <Clock3 size={12} />
                {setCount} sets
              </div>
            </div>
          </div>
        );
      })}

      {!logs.length && (
        <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-text-secondary">
          No workouts logged yet.
        </div>
      )}
    </div>
  </section>
);

export default WorkoutPage;
