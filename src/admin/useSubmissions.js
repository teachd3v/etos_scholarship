import React from 'react'
import { supabase } from '../lib/supabase.js'
import { mapApplicantRowToSubmission } from './adminUtils.js'

export function useSubmissions() {
  const [submissions, setSubmissions] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const fetchSubmissions = React.useCallback(async () => {
    setLoading(true)
    try {
      let allRows = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: rows, error } = await supabase
          .from('applicants')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('submitted_at', { ascending: false })
        
        if (error) throw error
        if (!rows || rows.length === 0) {
          hasMore = false
        } else {
          allRows = [...allRows, ...rows]
          if (rows.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        }
      }

      if (allRows.length === 0) { setSubmissions([]); return }

      // Fase 2 P1: Lazy-load detail data. We don't fetch achievements, orgs, docs here anymore.
      const mapped = allRows.map(r => mapApplicantRowToSubmission(r, [], [], []))
      setSubmissions(mapped)
    } catch (e) {
      console.error('useSubmissions error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSubmissions()
    // Realtime: refetch saat ada submission baru / status update
    const channel = supabase
      .channel('admin_applicants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants' }, () => fetchSubmissions())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchSubmissions])

  // updateStatus(applicantId, status): UPDATE applicants → trigger DB akan audit log + queue email
  const updateStatus = async (applicantId, status) => {
    // Optimistic UI
    setSubmissions(prev => prev.map(s => s._idx === applicantId ? { ...s, status } : s))
    const { error } = await supabase
      .from('applicants')
      .update({ status })
      .eq('id', applicantId)
    if (error) {
      console.error('updateStatus error:', error)
      // Rollback dengan refetch
      fetchSubmissions()
      alert('Gagal update status: ' + error.message)
    }
  }

  return { submissions, loading, updateStatus, refresh: fetchSubmissions }
}
