# Authentication

## Overview

Inventra uses **Supabase Auth** for authentication. User credentials and sessions are managed by Supabase, while additional profile data is stored in the `public.profiles` table.

## Auth Providers

- **Email/Password** — standard signup with email and password
- **Google OAuth** — sign in with Google (must be enabled in Supabase Dashboard > Authentication > Providers > Google)

## Database Schema

### `public.profiles` table

| Column     | Type                        | Notes                                    |
| ---------- | --------------------------- | ---------------------------------------- |
| id         | UUID (PK)                   | References `auth.users(id)` ON DELETE CASCADE |
| first_name | TEXT                        | From signup form metadata                |
| last_name  | TEXT                        | From signup form metadata                |
| role       | `public.user_role` (enum)   | Default: `'user'`                        |
| updated_at | TIMESTAMP WITH TIME ZONE    | Default: `NOW()` in UTC                  |

### `public.user_role` enum

- `admin` — full access, admin dashboard
- `user` — standard access, user dashboard

### Why no `email` column?

Email is already stored in `auth.users`. Duplicating it in profiles creates a sync problem. Access the email via `supabase.auth.getUser()` on the client or join with `auth.users` in queries.

## Trigger: Auto-create profile on signup

When a new user signs up, a PostgreSQL trigger (`on_auth_user_created`) automatically inserts a row into `public.profiles` with:

- `id` — from the new `auth.users` row
- `first_name` / `last_name` — from `raw_user_meta_data` (passed during signup)
- `role` — defaults to `'user'`

**Important:** The trigger always assigns the `'user'` role. Admin roles must be assigned manually via the Supabase dashboard or a SQL query:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

## Row Level Security (RLS)

| Policy                          | Action | Rule                              |
| ------------------------------- | ------ | --------------------------------- |
| Profiles are viewable by authenticated users | SELECT | `auth.uid() IS NOT NULL`          |
| Users can update own profile    | UPDATE | `auth.uid() = id`                 |
| Users can insert own profile    | INSERT | `auth.uid() = id`                 |

## Sign-in Flow

1. User submits email + password
2. `supabase.auth.signInWithPassword()` is called
3. On success, the user's `role` is fetched from `profiles`
4. Redirect based on role:
   - `admin` → `/admin/dashboard`
   - `user` → `/dashboard`

## Sign-up Flow

1. User submits first name, last name, email, password
2. `supabase.auth.signUp()` is called with `first_name` and `last_name` in `options.data`
3. Supabase creates the user in `auth.users`
4. The `on_auth_user_created` trigger fires and inserts a profile row
5. User is automatically signed in and redirected to `/dashboard`

## Google OAuth Flow

1. User clicks "Continue with Google"
2. `supabase.auth.signInWithOAuth()` redirects to Google
3. After Google auth, user is redirected back to `/dashboard`
4. The trigger creates a profile row (first_name/last_name will be `null` unless Google metadata is mapped)

## Environment Variables

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (`backend/.env`)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## SQL Files

All schema SQL is in `documentations/sql/`:

- `01_profiles.sql` — profiles table alterations, RLS policies, trigger function
