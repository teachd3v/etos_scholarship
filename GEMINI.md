# Etos Scholarship Portal - Project Instructions

## Architectural Map (Pustaka Project)
**CRITICAL:** To understand the architecture and quickly find the location of specific components, functions, or database tables, always refer to the **`ARCHITECTURE.md`** file in the root directory before initiating any complex search queries.

## Database Workflow (Database-as-Code)
We use Supabase with automated migrations managed by GitHub Actions.

### Making Schema Changes
1. **Never** make schema changes (tables, columns, RLS) directly in the Supabase Dashboard UI.
2. Create a new migration file in `supabase/migrations/` with the format `YYYYMMDD_description.sql`.
3. Write the necessary SQL (`CREATE TABLE`, `ALTER TABLE`, etc.).
4. Commit and push to the `main` branch.
5. GitHub Actions will automatically apply the migration to the production database.

### Environment Variables
- Local development uses `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Production (Vercel) automatically syncs these via the Supabase Integration.
- In Vercel, `VITE_` variables are aliased to the standard Supabase variables (e.g., `VITE_SUPABASE_URL` = `$SUPABASE_URL`).

### Deployment
- **Frontend:** Automatically deployed via Vercel on push to `main`.
- **Database:** Automatically updated via GitHub Actions on push to `main` (if `supabase/migrations/` is modified).
