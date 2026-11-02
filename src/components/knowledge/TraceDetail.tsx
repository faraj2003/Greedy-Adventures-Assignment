import type { BackendActivityTrace } from "@/lib/types";
import { contextWording } from "@/lib/traceLabels";

export function TraceDetail({ trace }: { trace: BackendActivityTrace }) {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-white" aria-live="polite">
      <div className="bg-ink p-7 text-white sm:p-10">
        <p className="text-sm text-white/60">Latest retrieval trace</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{trace.query}</h2>
        <p className="mt-3 text-sm text-white/60">
          {new Date(trace.timestamp).toLocaleString()}
        </p>
      </div>

      <div className="p-7 sm:p-10">
        <dl className="grid gap-8 md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-slate-soft">Result</dt>
            <dd className="mt-3">
              <span className="inline-flex rounded-full bg-mist px-3 py-1.5 text-xs font-bold">
                {trace.status}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-slate-soft">Media selected</dt>
            <dd className="mt-3 space-y-2">
              {trace.selectedMedia.length ? (
                trace.selectedMedia.map((media) => (
                  <p key={media.id} className="rounded-2xl bg-brand-tint px-4 py-3 text-sm text-brand-deep">
                    {media.title} <span className="text-slate-soft">({media.type})</span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-slate-soft">No media selected for this answer.</p>
              )}
              {trace.missingMedia.length > 0 && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  Requested but missing on the server: {trace.missingMedia.join(", ")}
                </p>
              )}
            </dd>
          </div>

          <div className="md:col-span-2">
            <dt className="text-sm font-semibold text-slate-soft">{contextWording(trace).heading}</dt>
            <dd className="mt-3 space-y-4">
              {trace.retrievedSources.length ? (
                trace.retrievedSources.map((source, index) => (
                  <article
                    key={source.sourceId}
                    className="rounded-2xl bg-mist p-5 text-sm"
                    aria-label={`Source ${index + 1}: ${source.title}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand-deep underline-offset-4 hover:underline"
                      >
                        {index + 1}. {source.title}
                      </a>
                      <span
                        className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs text-slate-soft"
                        title="Heuristic keyword-relevance score, not a confidence percentage"
                      >
                        Relevance {source.score.toFixed(2)}
                      </span>
                    </div>

                    <p className="mt-2 break-all font-mono text-xs text-slate-soft">{source.url}</p>
                    <p className="mt-1 text-xs text-slate-soft">
                      Captured {source.captureDate} · Relevance is a heuristic keyword score, not a confidence percentage.
                    </p>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.round(Math.min(1, source.score) * 100)}%` }}
                      />
                    </div>

                    <pre
                      tabIndex={0}
                      aria-label={`Text of source ${index + 1} ${contextWording(trace).sourceAria}`}
                      className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-xs leading-relaxed text-ink/75"
                    >
                      {source.passedText}
                    </pre>
                  </article>
                ))
              ) : (
                <span className="text-sm text-slate-soft">{contextWording(trace).empty}</span>
              )}

              {trace.passedContext && (
                <details className="rounded-2xl bg-mist p-5 text-sm">
                  <summary className="cursor-pointer font-semibold text-brand-deep">
                    {contextWording(trace).summary}
                  </summary>
                  <pre
                    tabIndex={0}
                    aria-label={contextWording(trace).blockAria}
                    className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-xs leading-relaxed text-ink/75"
                  >
                    {trace.passedContext}
                  </pre>
                </details>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
