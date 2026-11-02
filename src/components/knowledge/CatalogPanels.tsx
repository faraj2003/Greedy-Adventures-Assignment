import Image from "next/image";
import { ArrowUpRight, FileText, MapPin } from "lucide-react";
import type { KnowledgeSource, MediaAsset } from "@/lib/types";

export function SourcesPanel({ sources }: { sources: KnowledgeSource[] }) {
  return (
      <section className="rounded-2xl border border-line bg-white p-6 sm:p-8" aria-labelledby="loaded-sources-heading">
        <h2 id="loaded-sources-heading" className="font-display text-2xl font-bold">Loaded website sources</h2>
        <p className="mt-2 text-sm text-slate-soft">Curated public information used for grounded answers. Open a source to read its captured text.</p>

        <ul className="mt-6 space-y-3">
          {sources.map((source) => (
            <li key={source.id} className="rounded-2xl bg-mist p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1 font-semibold text-brand-deep underline-offset-4 hover:underline"
                  >
                    {source.title}
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink/30 group-hover:text-brand-deep" aria-hidden="true" />
                  </a>

                  <p className="mt-1 break-all font-mono text-xs text-slate-soft">{source.url}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-soft">
                    <span className="rounded-full bg-white px-2.5 py-1 font-medium text-ink/70">{source.category}</span>
                    <span>captured {source.captureDate}</span>
                  </p>
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-brand-deep">View captured text</summary>
                <pre
                  tabIndex={0}
                  aria-label={`Captured text of ${source.title}`}
                  className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-xs leading-relaxed text-ink/75"
                >
                  {source.text}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      </section>
  );
}

export function MediaPanel({ mediaAssets }: { mediaAssets: MediaAsset[] }) {
  return (
      <section className="rounded-2xl border border-line bg-white p-6 sm:p-8" aria-labelledby="media-registry-heading">
        <h2 id="media-registry-heading" className="font-display text-2xl font-bold">Available media</h2>
        <p className="mt-2 text-sm text-slate-soft">Assets the concierge can route to visitors.</p>

        <ul className="mt-6 space-y-4">
          {mediaAssets.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl bg-mist">
              {item.type === "video" ? (
                <video controls preload="none" poster={item.poster} aria-label={item.title} className="aspect-video w-full bg-ink">
                  <source src={item.url} type={item.mimeType ?? "video/mp4"} />
                </video>
              ) : item.type === "link" ? (
                <div className="relative h-32 w-full">
                  <Image src="/demo/sea-view-coast.jpg" alt="" aria-hidden="true" fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                </div>
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-brand-tint">
                  <span className="grid h-16 w-14 place-items-center rounded-lg bg-white text-brand shadow-soft">
                    <FileText className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </div>
              )}

              <div className="p-5">
                <a
                  href={item.url}
                  target={item.url.startsWith("http") ? "_blank" : undefined}
                  rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="font-semibold text-brand-deep underline-offset-4 hover:underline"
                >
                  {item.title}
                </a>

                <p className="mt-1 break-all font-mono text-xs text-slate-soft">{item.url}</p>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold uppercase text-ink/70">{item.type}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 font-medium text-ink/70">{item.sizeOrDuration}</span>
                  <span className={`rounded-full px-2.5 py-1 font-medium ${item.isDemoMaterial ? "bg-flare/15 text-flare-dark" : "bg-brand/10 text-brand-deep"}`}>
                    {item.isDemoMaterial ? "Demo material" : "External reference"}
                  </span>
                </p>

                <p className="mt-3 text-sm text-slate-soft">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
  );
}
