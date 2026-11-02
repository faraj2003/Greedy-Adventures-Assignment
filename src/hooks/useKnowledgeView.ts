"use client";

import { useCallback, useEffect, useState } from "react";
import type { BackendActivityTrace, KnowledgeSource, MediaAsset } from "@/lib/types";
import { DEFAULT_TEST_QUESTION } from "@/data/site";

const HISTORY_LIMIT = 50;

/** Earlier versions persisted visitor questions here. Nothing writes it any more; remove leftovers. */
const LEGACY_HISTORY_KEY = "ga-knowledge-trace-history-v1";

interface Catalog {
  sources: KnowledgeSource[];
  mediaAssets: MediaAsset[];
}

/**
 * Knowledge dashboard logic: loads the read-only source catalog when the view is shown, runs test
 * questions, and keeps the trace history. The history is in memory only. It is deliberately not
 * written to localStorage: this is a public page and visitor questions should not outlive the visit.
 */
export function useKnowledgeView(active: boolean) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [history, setHistory] = useState<BackendActivityTrace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [question, setQuestion] = useState(DEFAULT_TEST_QUESTION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  const rememberTrace = useCallback((trace: BackendActivityTrace) => {
    setHistory((current) => [trace, ...current.filter((item) => item.id !== trace.id)].slice(0, HISTORY_LIMIT));
    setSelectedId(trace.id);
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/knowledge");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load the knowledge view.");
      setCatalog({ sources: json.sources ?? [], mediaAssets: json.mediaAssets ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the knowledge view.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch the catalog the first time the view is shown (not on every page load).
  useEffect(() => {
    if (active && !catalog) void loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const runTest = useCallback(async () => {
    const text = question.trim();
    if (!text || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testQuestion: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not run the test.");
      if (!json.trace) throw new Error("The test completed without returning an activity trace.");
      rememberTrace(json.trace);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not run the test.");
    } finally {
      setLoading(false);
    }
  }, [question, loading, rememberTrace]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedId(null);
  }, []);

  const selectedTrace = history.find((t) => t.id === selectedId) ?? null;

  return {
    catalog, history, selectedTrace, question, setQuestion, loading, error,
    rememberTrace, runTest, clearHistory, selectTrace: (t: BackendActivityTrace) => setSelectedId(t.id),
  };
}
