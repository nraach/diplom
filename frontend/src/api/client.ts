import { TOKEN_STORAGE_KEY } from "../utils/constants";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = await readJson(response);
    throw new ApiError(payload?.message ?? "Не удалось выполнить запрос", response.status, payload?.details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentLength = response.headers.get("Content-Length");
  const contentType = response.headers.get("Content-Type");

  if (contentLength === "0" || !contentType?.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_URL}${path}`;
}

async function readJson(response: Response): Promise<{ message?: string; details?: unknown } | null> {
  try {
    return (await response.json()) as { message?: string; details?: unknown };
  } catch {
    return null;
  }
}
