// client/src/lib/api.ts

// 🌐 Automatically handle localhost or network IP
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

/**
 * Reusable API request helper
 * Automatically adds Authorization header if token is provided
 * Handles JSON safely
 */
export async function apiRequest<T = any>(
  method: string,
  endpoint: string,
  body?: any,
  token?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // ✅ Add Bearer token if available
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options: RequestInit = {
    method,
    headers,
    credentials: "include", // keep for cookie/session support
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url, options);

  // 🔥 Handle failed responses more cleanly
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;

    try {
      const errJson = await res.json();
      if (errJson?.message) message = errJson.message;
    } catch {
      const errText = await res.text();
      if (errText) message = errText;
    }

    throw new Error(message);
  }

  try {
    return await res.json();
  } catch {
    return {} as T;
  }
}
