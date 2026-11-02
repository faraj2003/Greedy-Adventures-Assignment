"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionBarPrimitive,
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessage,
} from "@assistant-ui/react";
import type { ChatModelAdapter, ThreadMessage, ThreadMessageLike } from "@assistant-ui/react";
import { AlertTriangle, ArrowUp, Download, ExternalLink, FileText, Plane, RotateCcw, SquarePen, Square, X } from "lucide-react";
import type { BackendActivityTrace, ChatApiResult, MediaAsset } from "@/lib/types";
import { buildHistory, makePayload, parsePayload, type ChatPayload, type PlainTurn } from "@/lib/chatFormat";
import { devControlsEnabled } from "@/lib/devControls";
import { useServiceMode, type ServiceMode } from "@/hooks/useServiceMode";
import type { Pkg } from "@/lib/packages";

const SHOW_DEV_CONTROLS = devControlsEnabled();

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={i} className="font-semibold text-ink">{bold[1]}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link && /^(https?:\/\/|\/)/.test(link[2])) {
      return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function FormattedText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  text.split(/\n{2,}/).forEach((block, bi) => {
    const lines = block.split("\n").filter((l) => l.trim());
    let i = 0;
    while (i < lines.length) {
      const bullet = /^\s*[-•]\s+/;
      const numbered = /^\s*\d+[.)]\s+/;
      const key = `${bi}-${i}`;
      if (bullet.test(lines[i])) {
        const items: string[] = [];
        while (i < lines.length && bullet.test(lines[i])) items.push(lines[i++].replace(bullet, ""));
        nodes.push(<ul key={key} className="list-disc space-y-1.5 pl-5">{items.map((l, j) => <li key={j}>{renderInline(l)}</li>)}</ul>);
      } else if (numbered.test(lines[i])) {
        const items: string[] = [];
        while (i < lines.length && numbered.test(lines[i])) items.push(lines[i++].replace(numbered, ""));
        nodes.push(<ol key={key} className="list-decimal space-y-1.5 pl-5">{items.map((l, j) => <li key={j}>{renderInline(l)}</li>)}</ol>);
      } else {
        const para: string[] = [];
        while (i < lines.length && !bullet.test(lines[i]) && !numbered.test(lines[i])) para.push(lines[i++]);
        nodes.push(<p key={key}>{para.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{renderInline(l)}</React.Fragment>)}</p>);
      }
    }
  });
  return <>{nodes}</>;
}

function DemoBadge({ show }: { show: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${show ? "bg-flare/15 text-flare-dark" : "bg-brand-tint text-brand-deep"}`}>
      {show ? "Demo material" : "Official site"}
    </span>
  );
}

function MediaCard({ asset }: { asset: MediaAsset }) {
  if (asset.type === "video") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-line bg-white">
        <video controls preload="metadata" poster={asset.poster} aria-label={asset.title} className="aspect-video w-full bg-ink">
          <source src={asset.url} type={asset.mimeType ?? "video/mp4"} />
          Your browser can’t play this video. <a href={asset.url} download>Download the MP4</a>.
        </video>
        <figcaption className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{asset.title}</span>
            <DemoBadge show={asset.isDemoMaterial} />
          </div>
          <p className="text-xs text-slate-soft">{asset.sizeOrDuration}</p>
          <p className="text-xs leading-relaxed text-slate-soft">{asset.description}</p>
          <a href={asset.url} download className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deep">
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download MP4
          </a>
        </figcaption>
      </figure>
    );
  }

  const isPdf = asset.type === "pdf";
  const Icon = isPdf ? FileText : ExternalLink;
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
          <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{asset.title}</span>
            <DemoBadge show={asset.isDemoMaterial} />
          </div>
          <p className="mt-1 text-xs text-slate-soft">{asset.sizeOrDuration}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-soft">{asset.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={asset.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold !text-white !no-underline hover:bg-brand-deep">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> {isPdf ? "Open PDF" : "Open page"}
        </a>
        {isPdf && (
          <a href={asset.url} download={asset.filename}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold !text-ink !no-underline hover:bg-mist">
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
          </a>
        )}
      </div>
    </div>
  );
}

function AssistantText(props: { text?: string; part?: { text?: string } }) {
  const body = props.text ?? props.part?.text ?? "";
  // Media, sources and the error flag ride in message metadata, not in the visible text.
  const rawPayload = useMessage((m) => m.metadata?.custom?.payload);
  const payload: ChatPayload = useMemo(() => parsePayload(rawPayload) ?? {}, [rawPayload]);

  if (payload.error) {
    return (
      <div role="alert" className="rounded-2xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{body}</span>
        </p>
        <ActionBarPrimitive.Root>
          <ActionBarPrimitive.Reload className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
          </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FormattedText text={body} />
      {payload.media && payload.media.length > 0 && (
        <div className="space-y-3 pt-1" aria-label="Requested media">
          {payload.media.map((asset) => <MediaCard key={asset.id} asset={asset} />)}
        </div>
      )}
      {payload.sources && payload.sources.length > 0 && (
        <p className="border-t border-ink/10 pt-3 text-xs text-slate-soft">
          Sources:{" "}
          {payload.sources.map((s, i) => (
            <React.Fragment key={`${s.url}-${i}`}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title.split(" | ")[0]}</a>
            </React.Fragment>
          ))}
        </p>
      )}
    </div>
  );
}

function Avatar() {
  return (
    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white">
      <Plane className="h-4 w-4 -rotate-45" strokeWidth={2} />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <Avatar />
      <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-[20px] rounded-bl-md bg-mist px-4 py-3 text-sm text-slate-soft">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/50" style={{ animationDelay: `${i * 180}ms` }} />
          ))}
        </span>
        <span>Concierge is checking the sources…</span>
      </div>
    </div>
  );
}

const STORAGE_KEY = "ga-concierge-conversation-v1";
const MAX_STORED_MESSAGES = 40;
const LEGACY_MARKER = /\s*<<<GA:[^>]*>>>\s*$/;

const SUGGESTED_PROMPTS = [
  "What's the difference between the packages?",
  "Where is the dropzone and how do I get there?",
  "I'm nervous about my first jump",
  "Please send me the PDF brochure",
  "I want to see the video",
];

interface StoredMessage {
  role: "user" | "assistant";
  text: string;
  payload?: ChatPayload;
}

function loadStoredMessages(): ThreadMessageLike[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const stored: StoredMessage[] = [];
    for (const m of parsed as unknown[]) {
      if (typeof m !== "object" || m === null) continue;
      const { role, text: rawText, payload } = m as Record<string, unknown>;
      if ((role !== "user" && role !== "assistant") || typeof rawText !== "string" || rawText.length >= 20000) continue;
      // Migration only: a conversation saved by an older build may still end in an inline payload marker.
      const text = rawText.replace(LEGACY_MARKER, "");
      if (!text) continue;
      stored.push({ role, text, payload: parsePayload(payload) });
    }
    return stored.slice(-MAX_STORED_MESSAGES).map((m): ThreadMessageLike =>
      m.role === "assistant"
        ? {
            role: "assistant",
            content: [{ type: "text", text: m.text }],
            status: { type: "complete", reason: "stop" },
            ...(m.payload ? { metadata: { custom: { payload: m.payload } } } : {}),
          }
        : { role: "user", content: [{ type: "text", text: m.text }] });
  } catch {
    return [];
  }
}

const textOf = (content: readonly { type: string; text?: string }[]): string =>
  content.filter((c) => c.type === "text").map((c) => c.text ?? "").join(" ").trim();

function saveStoredMessages(messages: readonly ThreadMessage[]) {
  try {
    const compact: StoredMessage[] = [];
    for (const m of messages) {
      if (m.role === "user") {
        const text = textOf(m.content);
        if (text) compact.push({ role: "user", text });
      } else if (m.role === "assistant" && m.status.type === "complete") {
        const text = textOf(m.content);
        const payload = parsePayload(m.metadata?.custom?.payload);
        if (text && !payload?.error) compact.push({ role: "assistant", text, ...(payload ? { payload } : {}) });
      }
    }
    const recent = compact.slice(-MAX_STORED_MESSAGES);
    if (recent.length === 0) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {
    // storage unavailable or full: the chat simply won't survive a refresh
  }
}

function clearStoredMessages() {
  try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

function ModeBadge({ info }: { info: ServiceMode | null }) {
  if (!info) return null;
  const live = info.mode === "live";
  return (
    <span
      data-testid="mode-badge"
      title={
        live
          ? `Answers are written by ${info.model ?? "the configured model"} from the retrieved sources.`
          : "No AI key is configured on this deployment, so answers come from rule-based, source-grounded fallback logic."
      }
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${live ? "bg-emerald-50 text-emerald-800" : "bg-flare/15 text-flare-dark"}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-600" : "bg-flare"}`} />
      {live ? "Live AI" : "Demo mode (no AI key)"}
    </span>
  );
}

interface ChatProps {
  onTraceUpdated?: (trace: BackendActivityTrace) => void;
  onClose?: () => void;
  /** Canonical package id the visitor picked on the page, if any. */
  packageContext?: Pkg | null;
}

export function AssistantChat(props: ChatProps) {
  // This component is only mounted client-side after the visitor opens the chat, so the stored
  // conversation can be read synchronously: no "Loading chat…" flash and no hydration mismatch.
  const [restored] = useState(loadStoredMessages);
  const [nonce, setNonce] = useState(0);
  return (
    <ChatBody
      key={nonce}
      {...props}
      initialMessages={nonce === 0 ? restored : []}
      onNewChat={() => { clearStoredMessages(); setNonce((n) => n + 1); }}
    />
  );
}

function ChatBody({
  onTraceUpdated,
  onClose,
  packageContext,
  initialMessages,
  onNewChat,
}: ChatProps & { initialMessages: ThreadMessageLike[]; onNewChat: () => void }) {
  const modeInfo = useServiceMode();
  const [simulateError, setSimulateError] = useState(false);
  const simulateErrorRef = useRef(simulateError);
  const traceCallbackRef = useRef(onTraceUpdated);
  const packageContextRef = useRef(packageContext);
  simulateErrorRef.current = simulateError;
  traceCallbackRef.current = onTraceUpdated;
  packageContextRef.current = packageContext;

  const adapter = useMemo<ChatModelAdapter>(() => ({
    async run({ messages, abortSignal }) {
      const fail = (message: string) => ({
        content: [{ type: "text" as const, text: message }],
        metadata: { custom: { payload: makePayload({ error: true }) } },
      });

      const lastUser = messages[messages.length - 1];
      const userText = textOf(lastUser?.content ?? []);

      // Failed replies are UI state, not conversation: keep them out of the history sent to the server.
      const turns = messages.slice(0, -1).flatMap((m): PlainTurn[] => {
        if (m.role === "user") return [{ role: m.role, text: textOf(m.content) }];
        if (m.role === "assistant" && !parsePayload(m.metadata?.custom?.payload)?.error) return [{ role: m.role, text: textOf(m.content) }];
        return [];
      });
      // The package-card line is pinned inside buildHistory, so long chats cannot push it out.
      const pkg = packageContextRef.current;
      const history = buildHistory(turns, pkg ? pkg.toUpperCase() : null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userText, history, simulateError: SHOW_DEV_CONTROLS && simulateErrorRef.current }),
          signal: abortSignal,
        });
        const data = (await res.json()) as Partial<ChatApiResult> & { error?: string };

        if (data.trace) traceCallbackRef.current?.(data.trace);

        if (res.status === 429) return fail(data.error || "You're sending messages quickly. Please wait a moment and try again.");
        if (!res.ok || data.isError) return fail(data.text || data.error || "The concierge request failed. Please try again.");

        return {
          content: [{ type: "text" as const, text: data.text ?? "" }],
          metadata: { custom: { payload: makePayload({ media: data.media, sources: data.sources }) } },
        };
      } catch (error) {
        if (abortSignal?.aborted || (error instanceof DOMException && error.name === "AbortError")) throw error;
        return fail("I couldn’t reach the concierge service. Check your connection and try again.");
      }
    },
  }), []);

  const runtime = useLocalRuntime(adapter, { initialMessages });

  useEffect(() => {
    return runtime.thread.subscribe(() => {
      const state = runtime.thread.getState();
      if (!state.isRunning) saveStoredMessages(state.messages);
    });
  }, [runtime]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white">
            <Plane className="h-5 w-5 -rotate-45" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[19px] leading-tight text-ink">Concierge</h2>
            <p className="mt-0.5 text-[13px] leading-snug text-slate-soft">Packages, getting there, first-timer questions, the brochure or a preview video.</p>
            <ModeBadge info={modeInfo} />
            {SHOW_DEV_CONTROLS && (
              <button
                type="button"
                onClick={() => setSimulateError((prev) => !prev)}
                aria-pressed={simulateError}
                title="Developer demo control: forces the next request to fail so the error state can be reviewed. Not a customer feature."
                className={`mt-3 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  simulateError ? "bg-flare text-ink" : "bg-mist text-ink/60 hover:text-ink"
                }`}
              >
                Developer demo: simulate service error ({simulateError ? "on" : "off"})
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onNewChat}
            aria-label="Start a new chat (clears this conversation)"
            title="New chat"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-soft transition-colors hover:bg-mist hover:text-ink"
          >
            <SquarePen className="h-5 w-5" aria-hidden="true" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-soft transition-colors hover:bg-mist hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversation with the Sea View Skydiving concierge"
            className="chat-scroll flex-1 space-y-4 overflow-y-auto bg-white px-4 py-5"
          >
            <ThreadPrimitive.Empty>
              <div className="space-y-3">
                <div className="flex items-end gap-2.5">
                  <Avatar />
                  <div className="rounded-[20px] rounded-bl-md bg-mist px-4 py-3 text-sm leading-relaxed text-ink/85">
                    Hello. I can compare Eco, Deluxe and VIP, help you pick one for your budget, explain how to reach the dropzone, or walk a first-timer through the day.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-[2.75rem]">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <ThreadPrimitive.Suggestion
                      key={prompt}
                      prompt={prompt}
                      method="replace"
                      autoSend
                      className="rounded-full border border-line bg-white px-3.5 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:border-ink"
                    >
                      {prompt}
                    </ThreadPrimitive.Suggestion>
                  ))}
                </div>
              </div>
            </ThreadPrimitive.Empty>
            <ThreadPrimitive.Messages
              components={{
                UserMessage: () => (
                  <MessagePrimitive.Root className="flex justify-end">
                    <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-brand px-4 py-3 text-sm leading-relaxed text-white">
                      <MessagePrimitive.Content />
                    </div>
                  </MessagePrimitive.Root>
                ),
                AssistantMessage: () => (
                  <MessagePrimitive.Root className="flex items-end gap-2.5">
                    <Avatar />
                    <div className="chat-prose min-w-0 max-w-[88%] break-words rounded-[20px] rounded-bl-md bg-mist px-4 py-3 text-sm leading-relaxed text-ink/90 [overflow-wrap:anywhere]">
                      <MessagePrimitive.Content components={{ Text: AssistantText }} />
                    </div>
                  </MessagePrimitive.Root>
                ),
              }}
            />
            <ThreadPrimitive.If running>
              <TypingIndicator />
            </ThreadPrimitive.If>
          </ThreadPrimitive.Viewport>

          <ComposerPrimitive.Root className="bg-white px-3 pb-3 pt-1">
            <div className="flex items-end gap-2 rounded-[26px] border border-line bg-mist p-1.5 pl-2 transition-colors focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20">
              <ComposerPrimitive.Input
                aria-label="Message the Sea View Skydiving concierge"
                placeholder="Ask about packages, travel or your first jump"
                rows={1}
                maxLength={600}
                className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-ink !outline-none placeholder:text-slate-soft/70"
              />
              <ThreadPrimitive.If running={false}>
                <ComposerPrimitive.Send
                  aria-label="Send message"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-deep disabled:bg-ink/10 disabled:text-ink/35"
                >
                  <ArrowUp className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
                </ComposerPrimitive.Send>
              </ThreadPrimitive.If>
              <ThreadPrimitive.If running>
                <ComposerPrimitive.Cancel aria-label="Stop" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-brand">
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </ComposerPrimitive.Cancel>
              </ThreadPrimitive.If>
            </div>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}
