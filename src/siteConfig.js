// Site-wide constants shared by the shell (App.jsx) and the lazily loaded pages.

/** Canonical origin used for canonical links, Open Graph tags and JSON-LD. */
export const SITE_URL = String(import.meta.env.VITE_PUBLIC_SITE_URL || 'https://cssguardianangel.com').replace(/\/+$/, '')

export const MS_PER_DAY = 24 * 60 * 60 * 1000

export const YOUTUBE_PAGE_URL = 'https://www.youtube.com/@CSSGuardianAngel'

/** Public support/privacy contact. Set VITE_SUPPORT_EMAIL to change it (defaults to the address on the Play Store listing). */
export const SUPPORT_EMAIL = String(import.meta.env.VITE_SUPPORT_EMAIL || 'muhammadhasan963@gmail.com').trim()
