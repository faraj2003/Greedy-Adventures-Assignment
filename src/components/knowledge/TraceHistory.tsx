import type { BackendActivityTrace } from "@/lib/types";

interface Props {
  history: BackendActivityTrace[];
  selectedId: string | null;
  onSelect: (trace: BackendActivityTrace) => void;
  onClear: () => void;
}

export function TraceHistory({ history, selectedId, onSelect, onClear }: Props) {
  if (history.length === 0) return null;
  return (
    <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8" aria-labelledby="trace-history-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-soft">This visit only</p>
          <h3 id="trace-history-heading" className="mt-1 font-display text-2xl font-bold text-ink">Question history</h3>
          <p className="mt-1 text-sm text-slate-soft">Your latest {history.length} questions from this visit. They are kept in memory only and are gone when you refresh or leave the page.</p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-slate-soft transition-colors hover:border-red-200 hover:text-red-700"
        >
          Clear history
        </button>
      </div>

      <ol className="mt-5 divide-y divide-line">
        {history.map((item) => (
          <li key={item.id} className="py-3 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => onSelect(item)}
              aria-pressed={selectedId === item.id}
              className={`w-full rounded-2xl p-3 text-left transition-colors hover:bg-mist ${
                selectedId === item.id ? "bg-mist ring-1 ring-brand/30" : ""
              }`}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">{item.query}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    item.status === "GROUNDED_OK"
                      ? "bg-go/10 text-go"
                      : "bg-flare/20 text-ink"
                  }`}
                >
                  {item.status}
                </span>
              </span>

              <span className="mt-1 block text-xs text-slate-soft">
                {new Date(item.timestamp).toLocaleString()} ·{" "}
                {item.retrievedSources?.length ?? 0} sources ·{" "}
                {item.selectedMedia?.length ?? 0} media assets
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
