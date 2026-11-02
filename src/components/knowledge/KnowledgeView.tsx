import type { useKnowledgeView } from "@/hooks/useKnowledgeView";
import { TraceHistory } from "./TraceHistory";
import { TraceDetail } from "./TraceDetail";
import { MediaPanel, SourcesPanel } from "./CatalogPanels";

type Knowledge = ReturnType<typeof useKnowledgeView>;

export function KnowledgeView({ knowledge }: { knowledge: Knowledge }) {
  const { catalog, history, selectedTrace, question, setQuestion, loading, error, runTest, clearHistory, selectTrace } = knowledge;

  return (
    <section className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-8 sm:pt-16">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-brand-deep">Behind the answers</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.02em] sm:text-5xl">Knowledge dashboard</h1>
        <p className="mt-5 max-w-lg text-lg text-slate-soft">
          Inspect the source material and retrieval trace used by the Sea View concierge. Ask a test question to see which content is passed to the model.
        </p>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void runTest(); }} className="mt-12 flex flex-col gap-2 rounded-2xl border border-line bg-white p-2 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">Test a question</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What media comes with the VIP package?"
            className="w-full rounded-full bg-transparent px-6 py-4 text-base outline-none placeholder:text-ink/40"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-full bg-ink px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Checking…" : "Run test"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <TraceHistory history={history} selectedId={selectedTrace?.id ?? null} onSelect={selectTrace} onClear={clearHistory} />

      {selectedTrace && <TraceDetail trace={selectedTrace} />}

      {catalog && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <SourcesPanel sources={catalog.sources} />
          <MediaPanel mediaAssets={catalog.mediaAssets} />
        </div>
      )}
    </section>
  );
}
