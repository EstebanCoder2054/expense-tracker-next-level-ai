-- Phase 2: core multi-tenant schema (mirrors local SQLite + user prefs)
-- Apply via: supabase db push   OR   paste into Dashboard → SQL Editor

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user; extend later with display_name, avatar_url)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Preferences (cloud copy of currency / locale / week start / onboarding flag)
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  locale_tag TEXT NOT NULL DEFAULT 'en-US',
  week_starts_on TEXT NOT NULL DEFAULT 'monday',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_week_check CHECK (week_starts_on IN ('monday', 'sunday'))
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Categories (same string ids as the mobile app for easier sync)
-- ---------------------------------------------------------------------------
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  icon TEXT NOT NULL DEFAULT 'pricetag-outline',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user_id ON public.categories (user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_own"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_own"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "categories_delete_own"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Expenses
-- ---------------------------------------------------------------------------
CREATE TABLE public.expenses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category_id TEXT NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  occurred_on DATE NOT NULL,
  note TEXT,
  space_id TEXT,
  kind TEXT NOT NULL DEFAULT 'expense',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT expenses_kind_check CHECK (kind IN ('expense', 'income'))
);

CREATE INDEX idx_expenses_user_occurred ON public.expenses (user_id, occurred_on DESC);
CREATE INDEX idx_expenses_user_category ON public.expenses (user_id, category_id);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert_own"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update_own"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "expenses_delete_own"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Prevent referencing another user's category via guessed id (FK alone is not enough).
CREATE OR REPLACE FUNCTION public.enforce_expense_category_same_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  cat_user UUID;
BEGIN
  SELECT c.user_id INTO cat_user FROM public.categories c WHERE c.id = NEW.category_id;
  IF cat_user IS NULL THEN
    RAISE EXCEPTION 'category not found';
  END IF;
  IF cat_user <> NEW.user_id THEN
    RAISE EXCEPTION 'category does not belong to this user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expenses_category_user_check ON public.expenses;

CREATE TRIGGER expenses_category_user_check
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_expense_category_same_user();

-- ---------------------------------------------------------------------------
-- New user: profile + default preferences (runs as SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
