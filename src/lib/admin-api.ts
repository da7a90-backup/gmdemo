// Client helpers for the /api/admin/* endpoints. Uniform { ok, data | error } shape.
export async function adminGet<T>(path: string): Promise<T> {
  const r = await fetch(path);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "request failed");
  return j.data as T;
}

export async function adminSend<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "request failed");
  return j.data as T;
}
