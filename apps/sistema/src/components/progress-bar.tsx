export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const reached = percent >= 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${reached ? "bg-green-600" : "bg-primary"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
