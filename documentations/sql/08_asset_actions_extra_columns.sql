-- Migration: add department_id, work_setup, and action_date to asset_actions
-- Run this if asset_actions table already exists from 07_asset_actions.sql

ALTER TABLE public.asset_actions
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS work_setup TEXT CHECK (work_setup IN ('on_site', 'remote', 'hybrid')),
  ADD COLUMN IF NOT EXISTS action_date TIMESTAMPTZ;
