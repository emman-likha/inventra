# Asset Check Out Feature

## Overview

The **Check Out** feature allows admins and users to assign assets (e.g. laptops, tools, equipment) to an **employee**, **customer**, or **department**. It tracks who has what, when it was checked out, and supports returning (checking in) assets.

---

## Database

### New Table: `asset_checkouts`

Tracks the full history of every checkout and return.

```sql
CREATE TABLE IF NOT EXISTS public.asset_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  checked_out_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  checked_out_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_out_at TIMESTAMPTZ DEFAULT now(),
  expected_return_date DATE,
  returned_at TIMESTAMPTZ,
  returned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Key rules:**
- Either `checked_out_to` (a user) or `department_id` (a department) must be set — not both.
- `checked_out_by` is the person who performed the checkout (admin or the user themselves).
- `returned_at` is NULL while the asset is still checked out.
- `expected_return_date` is optional — used for overdue tracking.

### Changes to `assets` Table

The existing `assigned_to` and `status` columns are already in place:
- `assigned_to` — set to the user's profile ID on checkout, cleared on return.
- `status` — set to `'checked_out'` on checkout, `'available'` on return.

No schema migration needed for the assets table.

---

## Backend API

### `POST /api/assets/:id/checkout`

Check out an asset to a user or department.

**Request body:**
```json
{
  "checked_out_to": "uuid (user profile id, optional)",
  "department_id": "uuid (department id, optional)",
  "expected_return_date": "2026-04-01 (optional)",
  "notes": "Issued for remote work (optional)"
}
```

**Logic:**
1. Verify asset exists and status is `'available'`.
2. Validate that either `checked_out_to` or `department_id` is provided (not both).
3. Insert a row into `asset_checkouts`.
4. Update the asset: set `status = 'checked_out'` and `assigned_to = checked_out_to`.
5. Return the checkout record.

**Error cases:**
- `404` — Asset not found.
- `409` — Asset is already checked out.
- `400` — Missing or invalid assignee.

---

### `POST /api/assets/:id/checkin`

Return a checked-out asset.

**Request body:**
```json
{
  "notes": "Returned in good condition (optional)"
}
```

**Logic:**
1. Verify asset exists and status is `'checked_out'`.
2. Find the active checkout record (where `returned_at IS NULL`).
3. Update the checkout record: set `returned_at = now()` and `returned_by`.
4. Update the asset: set `status = 'available'` and `assigned_to = NULL`.
5. Return the updated checkout record.

---

### `GET /api/assets/:id/checkouts`

Get the checkout history for a specific asset.

**Response:**
```json
[
  {
    "id": "uuid",
    "asset_id": "uuid",
    "checked_out_to": { "id": "uuid", "first_name": "John", "last_name": "Doe" },
    "department": { "id": "uuid", "name": "Engineering" },
    "checked_out_by": { "id": "uuid", "first_name": "Admin", "last_name": "User" },
    "checked_out_at": "2026-03-13T10:00:00Z",
    "expected_return_date": "2026-04-01",
    "returned_at": null,
    "notes": "Issued for remote work"
  }
]
```

---

## Frontend

### Checkout Flow

1. On the **Assets** page, each asset row with status `'available'` shows a **"Check Out"** button.
2. Clicking it opens a **Check Out Modal** with:
   - **Assign to** — searchable dropdown of users (from profiles).
   - **Or department** — dropdown of departments.
   - **Expected return date** — optional date picker.
   - **Notes** — optional text field.
   - **Confirm** button.
3. On success, the asset status updates to `'checked_out'` and the table refreshes.

### Check-In Flow

1. Assets with status `'checked_out'` show a **"Check In"** button.
2. Clicking it opens a **Check In Modal** with:
   - Shows who the asset is currently assigned to.
   - **Notes** — optional text field.
   - **Confirm Return** button.
3. On success, the asset status updates to `'available'`.

### Checkout History

- Accessible from an asset's detail/row via an **"History"** icon or expandable row.
- Shows a timeline of all past checkouts and returns.

---

## SQL File

Save the migration as `documentations/sql/04_asset_checkouts.sql`:

```sql
-- Asset checkouts history table
CREATE TABLE IF NOT EXISTS public.asset_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  checked_out_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  checked_out_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_out_at TIMESTAMPTZ DEFAULT now(),
  expected_return_date DATE,
  returned_at TIMESTAMPTZ,
  returned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Either a user or a department, not both
  CONSTRAINT checkout_assignee_check CHECK (
    (checked_out_to IS NOT NULL AND department_id IS NULL)
    OR (checked_out_to IS NULL AND department_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.asset_checkouts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all checkouts
DROP POLICY IF EXISTS "Checkouts are viewable by authenticated users." ON public.asset_checkouts;
CREATE POLICY "Checkouts are viewable by authenticated users." ON public.asset_checkouts
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- Authenticated users can insert checkouts
DROP POLICY IF EXISTS "Authenticated users can insert checkouts." ON public.asset_checkouts;
CREATE POLICY "Authenticated users can insert checkouts." ON public.asset_checkouts
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Authenticated users can update checkouts (for check-in)
DROP POLICY IF EXISTS "Authenticated users can update checkouts." ON public.asset_checkouts;
CREATE POLICY "Authenticated users can update checkouts." ON public.asset_checkouts
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- Auto-update updated_at on assets when checkout happens (already exists via trigger)

-- Index for fast lookup of active checkouts
CREATE INDEX IF NOT EXISTS idx_asset_checkouts_active
  ON public.asset_checkouts (asset_id)
  WHERE returned_at IS NULL;
```

---

## Summary

| Action     | Endpoint                      | Asset Status Change        |
|------------|-------------------------------|----------------------------|
| Check Out  | `POST /api/assets/:id/checkout` | `available` → `checked_out` |
| Check In   | `POST /api/assets/:id/checkin`  | `checked_out` → `available` |
| History    | `GET /api/assets/:id/checkouts` | — (read only)              |
