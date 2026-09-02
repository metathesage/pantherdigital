/**
 * Shared HTTP helpers for every outbound request (route handlers + client components).
 *
 * Why this exists: a bare `fetch()` to a third-party API has no timeout. When an
 * upstream is slow or black-holed (rate limit, DNS failure, regional outage) the
 * request can hang for minutes — the route never answers, the client's `loading`
 * flag never clears, and the site looks completely broken even though it is up.
 * Everything here is time-boxed, and failures are described in one place so routes
 * can degrade into a real response instead of a hang or an unhandled throw.
 *
 * Isomorphic on purpose: no `next/server` import, so client components can use it too.
 */

/** Server -> upstream provider (CoinGecko, DexScreener, OpenSea, RSS, RPC...). */
/* eslint-disable @typescript-eslint/no-explicit-any -- upstream provider payloads
   (CoinGecko, DexScreener, OpenSea, RSS, JSON-RPC) have no types we can import, and the
   handlers/UI below read fields off them directly. `any` is deliberately confined to this
   module's JSON helpers rather than scattered through every call site. */
export const UPSTREAM_TIMEOUT_MS = 12_000;
/** Browser -> our own /api routes. Slightly longer: the route has its own budget. */
export const CLIENT_TIMEOUT_MS = 15_000;

export class UpstreamError extends Error {
  /** HTTP status of a responding-but-unsuccessful upstream, when there was one. */
  readonly status?: number;
  /** True when we gave up waiting rather than being refused. */
  readonly timedOut: boolean;

  constructor(message: string, opts: { status?: number; timedOut?: boolean } = {}) {
    super(message);
    this.name = "UpstreamError";
    this.status = opts.status;
    this.timedOut = opts.timedOut ?? false;
  }

  /** Status a proxy route should surface for this failure. */
  get proxyStatus(): number {
    if (this.timedOut) return 504;
    if (this.status) return this.status;
    return 502;
  }
}

/** An upstream answered with a non-2xx status. */
export function upstreamStatus(status: number, message?: string): UpstreamError {
  const err = new UpstreamError(message ?? `upstream responded ${status}`, { status });
  return err;
}

export function isTimeoutError(e: unknown): boolean {
  if (e instanceof UpstreamError) return e.timedOut;
  const name = (e as { name?: string })?.name;
  return name === "AbortError" || name === "TimeoutError";
}

/**
 * `fetch` that always settles. Aborts after `timeoutMs` and normalises the two
 * boring failure modes (gave up / connection error) into `UpstreamError`.
 */
export async function timedFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (timedOut) {
      throw new UpstreamError(`upstream timed out after ${Math.round(timeoutMs / 1000)}s`, {
        timedOut: true,
      });
    }
    // The caller aborted us (unmount, superseded request) — report it as-is.
    if (init.signal?.aborted) throw e instanceof Error ? e : new UpstreamError("aborted");
    if (isTimeoutError(e)) throw new UpstreamError("upstream timed out", { timedOut: true });
    const detail = e instanceof Error ? e.message : String(e);
    throw new UpstreamError(detail === "fetch failed" ? "upstream unreachable" : detail);
  } finally {
    clearTimeout(timer);
  }
}

/** JSON GET/POST through `timedFetch`. Throws `UpstreamError` on any non-2xx. */
export async function fetchJson(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = UPSTREAM_TIMEOUT_MS
): Promise<any> {
  const res = await timedFetch(url, init, timeoutMs);
  if (!res.ok) throw upstreamStatus(res.status, `HTTP ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new UpstreamError("upstream returned invalid JSON", { status: res.status });
  }
}

/**
 * Best-effort JSON fetch for UI code and fan-out aggregation: never throws, just
 * reports `null` so one dead dependency cannot sink a whole page.
 */
export async function tryJson(
  url: string,
  init: RequestInit = {},
  timeoutMs = UPSTREAM_TIMEOUT_MS
): Promise<any | null> {
  try {
    return await fetchJson(url, init, timeoutMs);
  } catch {
    return null;
  }
}

/**
 * Client-side request with a deadline, so a stuck route handler or a stalling
 * public RPC can never leave the caller's spinner running forever.
 * Accepts the usual `RequestInit` plus `timeoutMs`.
 */
export async function clientJson<T = any>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = CLIENT_TIMEOUT_MS, ...requestInit } = init;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  requestInit.signal?.addEventListener("abort", () => controller.abort());
  try {
    const res = await fetch(url, { cache: "no-store", ...requestInit, signal: controller.signal });
    if (!res.ok) {
      throw new UpstreamError(res.status === 429 ? "rate limited (429)" : `request failed (${res.status})`, {
        status: res.status,
      });
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof UpstreamError) throw e;
    if (timedOut) throw new UpstreamError("request timed out", { timedOut: true });
    // Caller cancelled (unmount / superseded request) — surface, don't mislabel.
    if (requestInit.signal?.aborted) throw e instanceof Error ? e : new UpstreamError("aborted");
    throw new UpstreamError(e instanceof Error ? e.message : "request failed");
  } finally {
    clearTimeout(timer);
    requestInit.signal?.removeEventListener("abort", () => controller.abort());
  }
}
