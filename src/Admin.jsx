// Admin.jsx — Admin panel wrapper
import React from 'react'
import { AnnouncementAdmin } from './admin/AnnouncementAdmin.jsx'

export function AdminPanel({ mobile }) {
  return <AnnouncementAdmin mobile={mobile} />
}

export default AnnouncementAdmin
