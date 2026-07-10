const DEFAULT_API_URL = "http://localhost:3333/api";

export class ApiClientError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
};

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> => {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  } & T;

  if (!response.ok) {
    throw new ApiClientError(payload.message || "Erro ao consumir API.", response.status);
  }

  return payload as T;
};
