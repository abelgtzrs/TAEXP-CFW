const WORKOUT_GOLD_DAILY_CAP = 40;
const WORKOUT_GOLD_LOG_CAP = 30;
const WORKOUT_GOLD_MAX_REWARDED_EXERCISES = 6;
const WORKOUT_GOLD_MAX_REWARDED_SETS = 5;

const goldForSets = (sets) => {
  const count = Math.min(Array.isArray(sets) ? sets.length : 0, WORKOUT_GOLD_MAX_REWARDED_SETS);
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 3;
  return 5 + (count - 3);
};

const goldForExercise = (exercise) => {
  const strengthGold = goldForSets(exercise?.sets);
  const cardioMinutes = Number(exercise?.durationExerciseMinutes) || 0;
  const cardioGold = Math.min(10, Math.floor(cardioMinutes / 5));
  return Math.max(strengthGold, cardioGold);
};

const calculateWorkoutGold = (exercises, alreadyAwardedToday = 0) => {
  const rawGold = (Array.isArray(exercises) ? exercises : [])
    .slice(0, WORKOUT_GOLD_MAX_REWARDED_EXERCISES)
    .reduce((total, exercise) => total + goldForExercise(exercise), 0);
  const cappedForLog = Math.min(rawGold, WORKOUT_GOLD_LOG_CAP);
  const remainingDailyGold = Math.max(0, WORKOUT_GOLD_DAILY_CAP - (Number(alreadyAwardedToday) || 0));
  return Math.min(cappedForLog, remainingDailyGold);
};

const getRewardDayRange = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

module.exports = {
  calculateWorkoutGold,
  getRewardDayRange,
  WORKOUT_GOLD_DAILY_CAP,
  WORKOUT_GOLD_LOG_CAP,
};
