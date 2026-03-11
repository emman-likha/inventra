import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ── Profiles ───────────────────────────────────────────

export async function fetchMyProfile() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/profiles/me`, { headers });
  return handleResponse(res);
}

// ── Assets ─────────────────────────────────────────────

export async function fetchAssets() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/assets`, { headers });
  return handleResponse(res);
}

export async function createAsset(asset: {
  name: string;
  category: string;
  location?: string | null;
  status: string;
  value?: number | null;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/assets`, {
    method: "POST",
    headers,
    body: JSON.stringify(asset),
  });
  return handleResponse(res);
}

export async function importAssets(assets: {
  name: string;
  category: string;
  location?: string;
  status: string;
  value?: number;
}[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/assets/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({ assets }),
  });
  return handleResponse(res);
}

// ── Departments ────────────────────────────────────────

export async function fetchDepartments() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments`, { headers });
  return handleResponse(res);
}

export async function createDepartment(dept: {
  name: string;
  description?: string | null;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments`, {
    method: "POST",
    headers,
    body: JSON.stringify(dept),
  });
  return handleResponse(res);
}

export async function fetchDepartmentMembers(departmentId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments/${departmentId}/members`, { headers });
  return handleResponse(res);
}
