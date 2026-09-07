import React from 'react'
import '../styles.css'
import { AnnouncementCountdown } from './AnnouncementCountdown.jsx'
import { AnnouncementAdmin } from './admin/AnnouncementAdmin.jsx'

export default function App() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('etos_theme') || 'light')

  React.useEffect(() => {
    localStorage.setItem('etos_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const path = window.location.pathname.toLowerCase()
  const isAdminRoute = path === '/admin' || path === '/admin/'
  const isBypassRoute = path === '/bypasspengumuman' || path === '/bypasspengumuman/'

  if (isAdminRoute) {
    return <AnnouncementAdmin />
  }

  return <AnnouncementCountdown forceAnnounced={isBypassRoute} />
}
