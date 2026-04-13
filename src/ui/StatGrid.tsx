type StatGridItem = {
  label: string;
  value: string | number;
};

type StatGridProps = {
  items: readonly StatGridItem[];
  minWidth?: string;
  className?: string;
};

/** Auto-fit grid of label/value pairs — used for game state, combat stats, card counts. */
export default function StatGrid({ items, minWidth = "132px", className = "" }: StatGridProps) {
  return (
    <dl className={`mt-5 grid grid-cols-[repeat(auto-fit,minmax(${minWidth},1fr))] gap-3 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card p-3.5 px-4">
          <dt className="text-[0.76rem] uppercase tracking-[0.08em] text-ink-light">{item.label}</dt>
          <dd className="mt-1.5 text-base font-bold m-0">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
