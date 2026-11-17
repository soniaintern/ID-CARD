/** lowercase + strip everything except a-z0-9 (used for header & photo matching) */
export function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** remove the extension from a file name */
export function stripExtension(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base
}

export function baseName(fileName: string): string {
  return fileName.split(/[\\/]/).pop() ?? fileName
}

export function safeFileName(value: string): string {
  const cleaned = String(value ?? '')
    .replace(/[\\/:*?"<>|\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || 'card'
}

/** Excel cells come back as strings with the formatting applied - tidy them up */
export function cleanCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

export function normalizeGender(value: string): string {
  const v = normalizeKey(value)
  if (!v) return ''
  if (v === 'm' || v === 'male' || v === 'man' || v === 'p' || v === 'purush') return 'Male'
  if (v === 'f' || v === 'female' || v === 'woman' || v === 'stri') return 'Female'
  return value.trim()
}

export function normalizeBloodGroup(value: string): string {
  const raw = String(value ?? '').toUpperCase().replace(/\s+/g, '')
  if (!raw) return ''
  const map: Record<string, string> = {
    APOSITIVE: 'A+',
    ANEGATIVE: 'A-',
    BPOSITIVE: 'B+',
    BNEGATIVE: 'B-',
    OPOSITIVE: 'O+',
    ONEGATIVE: 'O-',
    ABPOSITIVE: 'AB+',
    ABNEGATIVE: 'AB-',
  }
  const compact = raw.replace(/[^A-Z+-]/g, '')
  if (/^(A|B|O|AB)[+-]$/.test(compact)) return compact
  const key = raw.replace(/[^A-Z]/g, '')
  return map[key] ?? raw
}

export function timestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
