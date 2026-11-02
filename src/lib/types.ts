export type MediaType = "pdf" | "video" | "link";

export interface KnowledgeSource {
  id: string;
  title: string;
  url: string;
  captureDate: string;
  category: string;
  text: string;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  title: string;
  filename?: string;
  url: string;

  poster?: string;
  mimeType?: string;
  sizeOrDuration: string;
  isDemoMaterial: boolean;
  sourceUrl: string;
  description: string;
}

export interface RetrievedSourceChunk {
  sourceId: string;
  title: string;
  url: string;
  captureDate: string;
  score: number;

  passedText: string;
}

export type ProviderRequestState = "not_sent" | "dispatched_no_response" | "confirmed";

export type TraceStatus = "GROUNDED_OK" | "UNAVAILABLE_INFO_REFUSAL" | "MODEL_ERROR";

export interface BackendActivityTrace {
  id: string;
  timestamp: string;
  query: string;
  status: TraceStatus;
  memoryContext: string;
  retrievedSources: RetrievedSourceChunk[];

  passedContext: string;
  selectedMedia: MediaAsset[];

  missingMedia: string[];
  routerReason: string;

  answer: string;

  modeLabel: "LIVE_LLM" | "GROUNDED_DETERMINISTIC_MOCK";

  modelRequestAttempted: boolean;

  modelCallStarted: boolean;

  providerRequest: ProviderRequestState;

  providerResponseStatus?: number;

  failureInjected: boolean;

  modelSkipReason?: string;

  modelName?: string;
}

export interface ChatTurnMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSourceRef {
  title: string;
  url: string;
}

export interface ChatApiResult {
  text: string;
  sources: ChatSourceRef[];
  media: MediaAsset[];
  trace: BackendActivityTrace;
  isError: boolean;
}
