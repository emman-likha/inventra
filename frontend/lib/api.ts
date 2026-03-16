import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  // getSession can return null if called before auth state initializes.
  // Try getSession first, then fall back to waiting for onAuthStateChange.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  // Wait for the session to become available (max 5s)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sub.unsubscribe();
      reject(new Error("Not authenticated"));
    }, 5000);

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        if (sess?.access_token) {
          clearTimeout(timeout);
          sub.unsubscribe();
          resolve({
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.access_token}`,
          });
        }
      }
    );
  });
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

export async function deleteAssets(ids: string[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/assets`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ ids }),
  });
  return handleResponse(res);
}

// ── Departments ────────────────────────────────────────

export async function fetchDepartments() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments`, { headers });
  return handleResponse(res);
}

export async function fetchDepartment(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments/${id}`, { headers });
  return handleResponse(res);
}

export async function createDepartment(dept: { name: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments`, {
    method: "POST",
    headers,
    body: JSON.stringify(dept),
  });
  return handleResponse(res);
}

export async function importDepartments(departments: { name: string }[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({ departments }),
  });
  return handleResponse(res);
}

export async function deleteDepartments(ids: string[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ ids }),
  });
  return handleResponse(res);
}

// ── Members ────────────────────────────────────────────

export interface MemberInput {
  department_id: string;
  first_name: string;
  last_name: string;
  employee_id?: string | null;
  position?: string | null;
  email?: string | null;
  site_location?: string | null;
}

export interface Member extends MemberInput {
  id: string;
  created_at: string;
  updated_at: string;
}

export async function fetchMembers(departmentId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/members?department_id=${departmentId}`, { headers });
  return handleResponse(res);
}

export async function createMember(member: MemberInput) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/members`, {
    method: "POST",
    headers,
    body: JSON.stringify(member),
  });
  return handleResponse(res);
}

export async function importMembers(members: MemberInput[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/members/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({ members }),
  });
  return handleResponse(res);
}

export async function deleteMembers(ids: string[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/members/bulk`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ ids }),
  });
  return handleResponse(res);
}

export async function updateMember(id: string, updates: Partial<Omit<MemberInput, "department_id">>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/members/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function deleteMember(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/members/${id}`, {
    method: "DELETE",
    headers,
  });
  return handleResponse(res);
}
