// Icons.jsx — thin stroke iconography
import React from 'react'

export const Icon = ({ d, size = 18, stroke = 2, fill = 'none', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
)

export const IChevronLeft  = (p) => <Icon {...p} d="M15 18l-6-6 6-6" />
export const IChevronRight = (p) => <Icon {...p} d="M9 18l6-6-6-6" />
export const IChevronDown  = (p) => <Icon {...p} d="M6 9l6 6 6-6" />
export const IChevronUp    = (p) => <Icon {...p} d="M18 15l-6-6-6 6" />
export const IArrowRight   = (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>} />
export const ICheck        = (p) => <Icon {...p} d="M5 13l4 4L19 7" />
export const IPlus         = (p) => <Icon {...p} d={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />
export const IX            = (p) => <Icon {...p} d={<><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>} />
export const ITrash        = (p) => <Icon {...p} d={<><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 13h12l1-13"/><path d="M9 7V4h6v3"/></>} />
export const IEdit         = (p) => <Icon {...p} d={<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>} />
export const IMail         = (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>} />
export const ILock         = (p) => <Icon {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>} />
export const IUser         = (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 5-6 8-6s7 2 8 6"/></>} />
export const ISparkle      = (p) => <Icon {...p} d={<><path d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8L12 3z"/></>} />
export const IStar         = (p) => <Icon {...p} d="M12 2l3 7 7 .5-5.5 4.5L18 22l-6-4-6 4 1.5-8L2 9.5 9 9z" />
export const IMap          = (p) => <Icon {...p} d={<><path d="M9 3l-6 2v16l6-2 6 2 6-2V3l-6 2z"/><path d="M9 3v16"/><path d="M15 5v16"/></>} />
export const IFile         = (p) => <Icon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>} />
export const ILogo         = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="1.5" y="1.5" width="37" height="37" rx="10" fill="#0F766E"/>
    <path d="M12 20l6 6 12-14" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="20" cy="20" r="15" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none"/>
  </svg>
)
export const IGoogle       = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)
export const IHome         = (p) => <Icon {...p} d={<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>} />
export const IDashboard    = (p) => <Icon {...p} d={<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>} />
export const ICheckCircle  = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></>} />
export const IAlert        = (p) => <Icon {...p} d={<><path d="M12 9v4"/><circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none"/><path d="M10.3 3.9L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></>} />
export const ISave         = (p) => <Icon {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M7 21V13h10v8"/><path d="M7 3v5h8"/></>} />
export const ISend         = (p) => <Icon {...p} d={<><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></>} />
export const ISun          = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>} />
export const IMoon         = (p) => <Icon {...p} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
export const IMenu         = (p) => <Icon {...p} d={<><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>} />
export const IBell         = (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/></>} />
export const ILogout      = (p) => <Icon {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>} />
export const ITrophy     = (p) => <Icon {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"/><path d="M18 4H6v7a6 6 0 0 0 12 0V4z"/></>} />
export const IHeart      = (p) => <Icon {...p} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
