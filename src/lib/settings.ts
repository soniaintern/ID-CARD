import type { CardData, CompanySettings, RowWithPhoto } from '../types'
import { safeFileName } from './text'

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Genius Consultants',
  logo: '',
  footerAddress: 'B-103, Bestech Business Tower, Sector 66,\nMohali, Punjab 160062',
  emergencyNumber: '+91 8872791500',
}

const STORAGE_KEY = 'idcard.settings.v1'

export function loadSettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<CompanySettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: CompanySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // storage full (big logo) - not fatal
  }
}

export function rowToCard(row: RowWithPhoto, settings: CompanySettings): CardData {
  return {
    companyName: row.companyName || settings.companyName,
    logo: settings.logo,
    empName: row.empName,
    empCode: row.empCode,
    gender: row.gender,
    bloodGroup: row.bloodGroup,
    emergencyNumber: row.emergencyNumber || settings.emergencyNumber,
    designation: row.designation,
    department: row.department,
    location: row.location,
    address: row.address,
    userImage: row.photo,
    footerAddress: settings.footerAddress,
  }
}

/** EMP001-Rahul Sharma.jpg  (falls back safely when fields are empty) */
export function cardFileName(row: { empCode: string; empName: string }): string {
  const code = safeFileName(row.empCode)
  const name = safeFileName(row.empName)
  const parts = [code, name].filter((part) => part && part !== 'card')
  return `${parts.join('-') || 'id-card'}.jpg`
}
