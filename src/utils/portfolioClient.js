import { hasSupabaseConfig, supabase } from './supabaseClient.js'

export const PORTFOLIO_BUCKET = 'ga-portfolio'
export const MAX_PORTFOLIO_ITEMS = 12
export const MAX_PORTFOLIO_FILE_BYTES = 8 * 1024 * 1024
export const MAX_PORTFOLIO_PHOTO_BYTES = 4 * 1024 * 1024
export const ALLOWED_PORTFOLIO_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx']
export const ALLOWED_PHOTO_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'blog',
  'blogs',
  'css',
  'dashboard',
  'guardian',
  'p',
  'portfolio',
  'profile',
  'signin',
  'sign-in',
  'signup',
])

const SETUP_HINT =
  'Portfolio storage is not ready yet. Run supabase/migrations/20260823_user_portfolios.sql in the Supabase SQL editor.'

export function slugifyPortfolio(value, fallback = '') {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  if (cleaned && !RESERVED_SLUGS.has(cleaned)) return cleaned
  const fallbackClean = String(fallback || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  if (fallbackClean && !RESERVED_SLUGS.has(fallbackClean)) return fallbackClean
  return ''
}

export function createEmptyPortfolio(authUser) {
  const username = String(authUser?.username || '').trim()
  const userId = String(authUser?.id || '')
  return {
    display_name: String(authUser?.fullName || '').trim(),
    headline: '',
    offer: '',
    bio: '',
    city: '',
    rate_text: '',
    skillsText: '',
    links: {
      whatsapp: '',
      upwork: '',
      fiverr: '',
      linkedin: '',
      website: '',
    },
    slug: slugifyPortfolio(username, userId ? `user-${userId.slice(0, 8)}` : ''),
    is_public: true,
    photo_path: '',
    photoUrl: '',
  }
}

export function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'GA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function parseSkills(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16)
}

function normalizeLinks(links) {
  const source = links && typeof links === 'object' ? links : {}
  return {
    whatsapp: String(source.whatsapp || '').trim(),
    upwork: String(source.upwork || '').trim(),
    fiverr: String(source.fiverr || '').trim(),
    linkedin: String(source.linkedin || '').trim(),
    website: String(source.website || '').trim(),
    photo_path: String(source.photo_path || '').trim(),
  }
}

export function toHttpUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function toWhatsAppUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  let digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0') && digits.length === 11) digits = `92${digits.slice(1)}`
  return `https://wa.me/${digits}`
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function isImageMime(mime, fileName = '') {
  if (String(mime || '').startsWith('image/')) return true
  return /\.(png|jpe?g|webp)$/i.test(fileName)
}

export function getPortfolioFileUrl(filePath) {
  if (!supabase || !filePath) return ''
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(filePath)
  return data?.publicUrl || ''
}

function mapPortfolioRow(row, authUser) {
  const empty = createEmptyPortfolio(authUser)
  if (!row) return empty
  const skills = Array.isArray(row.skills) ? row.skills.filter(Boolean) : []
  const links = normalizeLinks(row.links)
  const photoPath = String(row.photo_path || links.photo_path || '')
  return {
    display_name: String(row.display_name || empty.display_name),
    headline: String(row.headline || ''),
    offer: String(row.offer || ''),
    bio: String(row.bio || ''),
    city: String(row.city || ''),
    rate_text: String(row.rate_text || ''),
    skillsText: skills.join(', '),
    links,
    slug: String(row.slug || empty.slug),
    is_public: row.is_public !== false,
    photo_path: photoPath,
    photoUrl: getPortfolioFileUrl(photoPath),
  }
}

function mapItemRow(row) {
  return {
    id: row.id,
    title: String(row.title || ''),
    description: String(row.description || ''),
    itemType: String(row.item_type || 'document'),
    filePath: row.file_path || '',
    fileName: row.file_name || '',
    fileMime: row.file_mime || '',
    fileSize: Number(row.file_size) || 0,
    externalUrl: row.external_url || '',
    fileUrl: getPortfolioFileUrl(row.file_path),
    createdAt: row.created_at || '',
  }
}

function explainSupabaseError(error) {
  const message = String(error?.message || '')
  const code = String(error?.code || '')
  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.toLowerCase().includes('schema cache') ||
    message.toLowerCase().includes('does not exist')
  ) {
    return SETUP_HINT
  }
  if (message.toLowerCase().includes('bucket') || code === 'NotFound') {
    return SETUP_HINT
  }
  if (code === '23505' || message.toLowerCase().includes('duplicate')) {
    return 'That public link is already taken. Choose another slug.'
  }
  return message || 'Unable to save your portfolio.'
}

export function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error('Sign-in is not configured, so portfolios cannot be saved yet.')
  }
  return supabase
}

export async function fetchMyPortfolio(authUser) {
  const client = requireSupabase()
  const { data, error } = await client.from('user_portfolios').select('*').eq('user_id', authUser.id).maybeSingle()
  if (error) throw new Error(explainSupabaseError(error))
  return mapPortfolioRow(data, authUser)
}

export async function fetchMyPortfolioItems(userId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('user_portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(explainSupabaseError(error))
  return (data || []).map(mapItemRow)
}

export async function fetchPublicPortfolio(slug) {
  const client = requireSupabase()
  const cleanSlug = slugifyPortfolio(slug)
  if (!cleanSlug) return { portfolio: null, items: [] }

  const { data: portfolio, error } = await client
    .from('user_portfolios')
    .select('*')
    .eq('slug', cleanSlug)
    .eq('is_public', true)
    .maybeSingle()
  if (error) throw new Error(explainSupabaseError(error))
  if (!portfolio) return { portfolio: null, items: [] }

  const { data: items, error: itemsError } = await client
    .from('user_portfolio_items')
    .select('*')
    .eq('user_id', portfolio.user_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (itemsError) throw new Error(explainSupabaseError(itemsError))

  return {
    portfolio: mapPortfolioRow(portfolio),
    items: (items || []).map(mapItemRow),
  }
}

export async function saveMyPortfolio(authUser, draft) {
  const client = requireSupabase()
  const slug = slugifyPortfolio(draft.slug, `user-${String(authUser.id).slice(0, 8)}`)
  if (!slug) throw new Error('Choose a public link made of letters, numbers, and hyphens.')

  const payload = {
    user_id: authUser.id,
    slug,
    display_name: String(draft.display_name || '').trim(),
    headline: String(draft.headline || '').trim(),
    offer: String(draft.offer || '').trim(),
    bio: String(draft.bio || '').trim(),
    city: String(draft.city || '').trim(),
    rate_text: String(draft.rate_text || '').trim(),
    skills: parseSkills(draft.skillsText),
    links: normalizeLinks({
      ...draft.links,
      photo_path: draft.photo_path || draft.links?.photo_path || '',
    }),
    is_public: Boolean(draft.is_public),
    updated_at: new Date().toISOString(),
  }

  if (!payload.display_name) throw new Error('Add your display name before saving.')

  const { error } = await client.from('user_portfolios').upsert(payload, { onConflict: 'user_id' })
  if (error) throw new Error(explainSupabaseError(error))
  return {
    ...draft,
    slug,
    skillsText: payload.skills.join(', '),
    photo_path: payload.links.photo_path,
    photoUrl: getPortfolioFileUrl(payload.links.photo_path),
    links: payload.links,
  }
}

function extensionOf(fileName) {
  const match = String(fileName || '').toLowerCase().match(/(\.[a-z0-9]+)$/)
  return match ? match[1] : ''
}

function safeFileName(name) {
  const cleaned = String(name || 'file')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return cleaned || 'file'
}

export function validatePortfolioFile(file) {
  if (!file) return 'Choose a file to upload.'
  if (file.size > MAX_PORTFOLIO_FILE_BYTES) {
    return `"${file.name}" is over 8 MB. Please upload a smaller file.`
  }
  const ext = extensionOf(file.name)
  if (!ALLOWED_PORTFOLIO_EXTENSIONS.includes(ext)) {
    return 'Upload a PDF, Word file, or image (PNG, JPG, WEBP).'
  }
  return ''
}

export function validatePortfolioPhoto(file) {
  if (!file) return 'Choose a profile photo.'
  if (file.size > MAX_PORTFOLIO_PHOTO_BYTES) {
    return `"${file.name}" is over 4 MB. Please upload a smaller photo.`
  }
  const ext = extensionOf(file.name)
  if (!ALLOWED_PHOTO_EXTENSIONS.includes(ext) && !String(file.type || '').startsWith('image/')) {
    return 'Upload a PNG, JPG, or WEBP photo.'
  }
  return ''
}

export async function uploadPortfolioPhoto(userId, file, previousPath = '') {
  const client = requireSupabase()
  const fileError = validatePortfolioPhoto(file)
  if (fileError) throw new Error(fileError)

  const photoPath = `${userId}/avatar/${Date.now()}-${safeFileName(file.name)}`
  const { error: uploadError } = await client.storage.from(PORTFOLIO_BUCKET).upload(photoPath, file, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  })
  if (uploadError) throw new Error(explainSupabaseError(uploadError))

  if (previousPath && previousPath !== photoPath) {
    await client.storage.from(PORTFOLIO_BUCKET).remove([previousPath])
  }

  return {
    photo_path: photoPath,
    photoUrl: getPortfolioFileUrl(photoPath),
  }
}

export async function removePortfolioPhoto(previousPath = '') {
  const client = requireSupabase()
  if (previousPath) {
    await client.storage.from(PORTFOLIO_BUCKET).remove([previousPath])
  }
}

export async function addPortfolioItem({ userId, title, description, file, externalUrl, currentCount }) {
  const client = requireSupabase()
  if (currentCount >= MAX_PORTFOLIO_ITEMS) {
    throw new Error(`You can showcase up to ${MAX_PORTFOLIO_ITEMS} items.`)
  }

  const cleanTitle = String(title || '').trim()
  const cleanDescription = String(description || '').trim()
  const cleanUrl = toHttpUrl(externalUrl)
  if (!cleanTitle) throw new Error('Give this work sample a title.')
  if (!file && !cleanUrl) throw new Error('Upload a file or add a link.')

  if (file) {
    const fileError = validatePortfolioFile(file)
    if (fileError) throw new Error(fileError)
  }

  const itemId = crypto.randomUUID()
  let filePath = ''
  if (file) {
    filePath = `${userId}/${itemId}/${safeFileName(file.name)}`
    const { error: uploadError } = await client.storage.from(PORTFOLIO_BUCKET).upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (uploadError) {
      throw new Error(explainSupabaseError(uploadError))
    }
  }

  const { data, error } = await client
    .from('user_portfolio_items')
    .insert({
      id: itemId,
      user_id: userId,
      title: cleanTitle,
      description: cleanDescription,
      item_type: file ? 'document' : 'link',
      file_path: filePath || null,
      file_name: file?.name || null,
      file_mime: file?.type || null,
      file_size: file?.size || null,
      external_url: cleanUrl || null,
      sort_order: currentCount,
    })
    .select('*')
    .single()

  if (error) {
    if (filePath) {
      await client.storage.from(PORTFOLIO_BUCKET).remove([filePath])
    }
    throw new Error(explainSupabaseError(error))
  }

  return mapItemRow(data)
}

export async function deletePortfolioItem(userId, item) {
  const client = requireSupabase()
  if (item?.filePath) {
    await client.storage.from(PORTFOLIO_BUCKET).remove([item.filePath])
  }
  const { error } = await client.from('user_portfolio_items').delete().eq('id', item.id).eq('user_id', userId)
  if (error) throw new Error(explainSupabaseError(error))
}

export function visibleLinkEntries(links) {
  const normalized = normalizeLinks(links)
  const entries = []
  const whatsapp = toWhatsAppUrl(normalized.whatsapp)
  if (whatsapp) entries.push({ label: 'WhatsApp', href: whatsapp })
  if (normalized.upwork) entries.push({ label: 'Upwork', href: toHttpUrl(normalized.upwork) })
  if (normalized.fiverr) entries.push({ label: 'Fiverr', href: toHttpUrl(normalized.fiverr) })
  if (normalized.linkedin) entries.push({ label: 'LinkedIn', href: toHttpUrl(normalized.linkedin) })
  if (normalized.website) entries.push({ label: 'Website', href: toHttpUrl(normalized.website) })
  return entries
}
