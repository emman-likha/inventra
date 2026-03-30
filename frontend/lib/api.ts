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

// ── Asset Actions ─────────────────────────────────────

export interface AssetAction {
  id: string;
  asset_id: string;
  action: string;
  member_id: string | null;
  department_id: string | null;
  from_location: string | null;
  to_location: string | null;
  work_setup: string | null;
  action_date: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  asset: { id: string; name: string } | null;
  member: { id: string; first_name: string; last_name: string } | null;
  department: { id: string; name: string } | null;
}

export async function fetchAssetActions() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/asset-actions`, { headers });
  return handleResponse(res);
}

export async function cancelAssetAction(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/asset-actions/${id}`, {
    method: "DELETE",
    headers,
  });
  return handleResponse(res);
}

export async function createAssetAction(data: {
  asset_id: string;
  action: string;
  member_id?: string | null;
  department_id?: string | null;
  to_location?: string | null;
  work_setup?: string | null;
  action_date?: string | null;
  notes?: string | null;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/asset-actions`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
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
  assigned_to?: string | null;
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

export async function updateAsset(id: string, updates: Partial<{
  name: string;
  category: string;
  location: string | null;
  status: string;
  value: number | null;
  assigned_to: string | null;
}>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/assets/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
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

export async function updateDepartment(id: string, updates: { name: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/departments/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
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

// ── Inventories (stock / consumables) ─────────────────

export interface Inventory {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  min_quantity: number;
  unit: string;
  cost_per_unit: number | null;
  location: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryInput {
  name: string;
  category?: string | null;
  quantity?: number;
  min_quantity?: number;
  unit?: string;
  cost_per_unit?: number | null;
  location?: string | null;
  description?: string | null;
}

export async function fetchInventories() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/inventories`, { headers });
  return handleResponse(res);
}

export async function fetchInventory(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/inventories/${id}`, { headers });
  return handleResponse(res);
}

export async function createInventory(inventory: InventoryInput) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/inventories`, {
    method: "POST",
    headers,
    body: JSON.stringify(inventory),
  });
  return handleResponse(res);
}

export async function importInventories(inventories: InventoryInput[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/inventories/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({ inventories }),
  });
  return handleResponse(res);
}

export async function updateInventory(id: string, updates: Partial<InventoryInput>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/inventories/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function deleteInventories(ids: string[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/inventories`, {
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

export async function fetchAllMembers() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/members`, { headers });
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
