-- Fix Infinite Recursion on admin_users RLS
-- The previous policy caused an infinite recursion because it queried admin_users inside its own policy.
-- This new policy allows users to read their own admin status without triggering a recursive subquery.

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

CREATE POLICY "Admins can view admin_users" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Also refresh PostgREST cache just in case
NOTIFY pgrst, 'reload schema';
