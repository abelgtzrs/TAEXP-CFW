export const calculateOverallActivityScore = (items = []) => {
  if (items.length === 0) return 0;

  const total = items.reduce(
    (sum, item) =>
      sum + (item.overallContribution ?? (item.reverseStatus ? 100 - item.score : item.score)),
    0,
  );

  return total / items.length;
};
