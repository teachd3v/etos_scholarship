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

  const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname === '/admin/'

  if (isAdminRoute) {
    return <AnnouncementAdmin />
  }

  return <AnnouncementCountdown />
}
