interface ScoreBreakdownProps {
  breakdown: Record<string, number> | null | undefined;
  maxScore?: number;
}

const CATEGORY_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
];

export function ScoreBreakdown({ breakdown, maxScore = 100 }: ScoreBreakdownProps) {
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">No breakdown available</div>
    );
  }

  const entries = Object.entries(breakdown).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="flex h-4 w-full rounded-full overflow-hidden gap-px">
        {entries.map(([category, points], i) => {
          const pct = (points / maxScore) * 100;
          return (
            <div
              key={category}
              className={`${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${category}: ${points}`}
            />
          );
        })}
        {/* Unfilled portion */}
        {total < maxScore && (
          <div
            className="bg-muted/40 flex-1"
            style={{ width: `${((maxScore - total) / maxScore) * 100}%` }}
          />
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([category, points], i) => (
          <div key={category} className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-sm ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} />
            <span>{category.replace(/_/g, " ")}</span>
            <span className="font-medium text-foreground">+{points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
