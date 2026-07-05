import type {
  AccuracyResponse,
  AttestationsResponse,
  ClustersResponse,
  FixturesLiveResponse,
  HealthResponse,
  StatsResponse,
} from "./types";

/**
 * Base URL for the Sharp Movement Detector API.
 * Override at build time with VITE_API_URL if the API isn't on localhost.
 */
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3001";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "ngrok-skip-browser-warning": "true" }
  });
  if (!res.ok) {
    throw new ApiError(`Request failed: ${path}`, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => getJson<HealthResponse>("/api/health"),
  stats: () => getJson<StatsResponse>("/api/stats"),
  accuracy: () => getJson<AccuracyResponse>("/api/accuracy"),
  attestations: () => getJson<AttestationsResponse>("/api/attestations"),
  fixturesLive: () => getJson<FixturesLiveResponse>("/api/fixtures/live"),
  clusters: (params?: { eventType?: string; minConfidence?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.eventType) qs.set("eventType", params.eventType);
    if (params?.minConfidence) qs.set("minConfidence", String(params.minConfidence));
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return getJson<ClustersResponse>(`/api/signals/clusters${suffix}`);
  },
};

export { ApiError };
