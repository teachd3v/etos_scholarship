import { supabase } from './supabase.js'

/**
 * Fetch all verification items (the checklist templates).
 */
export async function fetchVerificationItems() {
  const { data, error } = await supabase
    .from('verification_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching verification items:', error)
    return []
  }
  return data
}

/**
 * Fetch verification results for a specific applicant.
 */
export async function fetchVerificationResults(applicantId) {
  const { data, error } = await supabase
    .from('verification_results')
    .select('item_id, status, notes')
    .eq('applicant_id', applicantId)
  
  if (error) {
    console.error('Error fetching verification results:', error)
    return []
  }
  return data
}

/**
 * Save (Upsert) a verification result for an item.
 */
export async function saveVerificationResult({ applicantId, itemId, status, notes }) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('verification_results')
    .upsert({
      applicant_id: applicantId,
      item_id: itemId,
      status,
      notes,
      verified_by: user?.id,
      verified_at: new Date().toISOString()
    }, { onConflict: 'applicant_id,item_id' })
  
  if (error) {
    console.error('Error saving verification result:', error)
    throw error
  }
}
