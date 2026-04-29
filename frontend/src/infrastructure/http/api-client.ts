import { API_URL } from "@/infrastructure/config/env";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = opts;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const json = await response.json();
      detail = json?.detail ?? JSON.stringify(json);
    } catch {
      detail = response.statusText;
    }
    throw new Error(`[${response.status}] ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
