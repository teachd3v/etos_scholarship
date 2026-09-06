// supabase.js — Safe stub now that Supabase backend has been archived & decommissioned.
// Prevents network errors (ERR_NAME_NOT_RESOLVED, gotrue lock timeouts, and websocket retries).

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase telah dinonaktifkan.') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (cb) => {
      // Return safe unsubscribe
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
      }),
      range: () => ({
        order: async () => ({ data: [], error: null }),
      }),
      maybeSingle: async () => ({ data: null, error: null }),
    }),
    upsert: async () => ({ data: null, error: null }),
  }),
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      createSignedUrl: async () => ({ data: null, error: null }),
    }),
  },
}
