const WorkoutLogItem = ({ log }) => {
  // Format the date to be more readable, e.g., "June 21, 2025"
  const formattedDate = new Date(log.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
        <div>
          <p className="text-xs md:text-sm text-text-secondary">{formattedDate}</p>
          <h3 className="text-lg md:text-xl font-bold text-primary">{log.workoutName}</h3>
        </div>
        <div className="text-left md:text-right w-full md:w-auto flex justify-between md:block">
          <p className="text-xs md:text-sm text-text-main">{log.exercises.length} Exercises</p>
          <p className="text-xs md:text-sm text-text-main">{log.durationSessionMinutes || "N/A"} mins</p>
        </div>
      </div>
      <ul className="mt-4 text-sm md:text-xs text-text-main list-disc list-inside space-y-1">
        {log.exercises.map((ex, index) => (
          <li key={index}>
            <span className="font-semibold">{ex.exerciseDefinition?.name || "Unknown Exercise"}</span>: {ex.sets.length}{" "}
            sets
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkoutLogItem;
