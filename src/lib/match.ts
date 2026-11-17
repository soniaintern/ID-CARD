import type { EmployeeRow, PhotoEntry, RowWithPhoto } from '../types'
import { normalizeKey, stripExtension } from './text'

/**
 * Photo matching rules (first hit wins):
 *  1. exact match on the "Photo File Name" column from the sheet
 *  2. exact match on Emp Code, then on Employee Name
 *  3. file name starts with / ends with the Emp Code or Name  ->  "EMP001-rahul.jpg"
 *  4. file name contains the Emp Code or Name (keys of 3+ chars only)
 */
export function applyPhoto(row: EmployeeRow, photos: PhotoEntry[]): RowWithPhoto {
  if (photos.length === 0) return { ...row, photo: '', photoSource: '' }

  const candidates: string[] = []
  if (row.photoName) candidates.push(normalizeKey(stripExtension(row.photoName)))
  if (row.empCode) candidates.push(normalizeKey(row.empCode))
  if (row.empName) candidates.push(normalizeKey(row.empName))
  const keys = candidates.filter((key) => key.length > 0)

  for (const key of keys) {
    const hit = photos.find((photo) => photo.key === key)
    if (hit) return { ...row, photo: hit.dataUrl, photoSource: hit.name }
  }

  const strongKeys = keys.filter((key) => key.length >= 3)
  for (const key of strongKeys) {
    const hit = photos.find((photo) => photo.key.startsWith(key) || photo.key.endsWith(key))
    if (hit) return { ...row, photo: hit.dataUrl, photoSource: hit.name }
  }

  for (const key of strongKeys) {
    const hit = photos.find((photo) => photo.key.includes(key))
    if (hit) return { ...row, photo: hit.dataUrl, photoSource: hit.name }
  }

  return { ...row, photo: '', photoSource: '' }
}

export function countMatched(rows: RowWithPhoto[]): number {
  return rows.filter((row) => Boolean(row.photo)).length
}

/** Photo file names that could not be linked to any employee row */
export function unusedPhotos(rows: RowWithPhoto[], photos: PhotoEntry[]): PhotoEntry[] {
  const used = new Set(rows.map((row) => row.photoSource).filter(Boolean))
  return photos.filter((photo) => !used.has(photo.name))
}
