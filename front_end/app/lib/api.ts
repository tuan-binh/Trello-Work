import { API_URL } from "./config";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  const defaultHeaders: Record<string, string> = {};

  if (!(rest.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (requiresAuth && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...rest,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Lỗi: ${response.statusText} (${response.status})`);
  }

  return data as T;
}
