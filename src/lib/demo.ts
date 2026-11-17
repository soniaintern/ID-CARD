import type { PhotoEntry } from '../types'
import type { ParsedSheet } from './parse'
import { SAMPLE_HEADERS } from './sample'
import { normalizeKey } from './text'

const DEMO_ROWS: string[][] = [
  ['EMP001', 'Rahul Sharma', 'Male', 'B+', 'Software Engineer', 'IT', 'Mohali', 'B-103, Bestech Business Tower, Sector 66, Mohali 160062', '+91 8872791500', 'Genius Consultants'],
  ['EMP002', 'Priya Verma', 'Female', 'O+', 'HR Executive', 'Human Resource', 'Chandigarh', '7A, Madhya Marg, Sector 7C, Chandigarh 160019', '+91 8872791501', 'Genius Consultants'],
  ['EMP003', 'Amit Kumar', 'Male', 'A-', 'Field Officer', 'Operations', 'Ludhiana', 'SCF 84, Grain Market, Gill Road, Ludhiana 141003', '+91 8872791502', 'Genius Consultants'],
  ['EMP004', 'Neha Singh', 'Female', 'AB+', 'Accountant', 'Finance', 'Jaipur', 'SP - 636 A2, Road No. 6, VKI Area, Jaipur 302013', '+91 8872791503', 'Genius Consultants'],
  ['EMP005', 'Sandeep Yadav', 'Male', 'O-', 'Supervisor', 'Warehouse', 'Hisar', 'Soni Complex, 4th Milestone, Sirsa Road, Hisar 125001', '+91 8872791504', 'Genius Consultants'],
]

/** 5 ready-made rows so the tool can be test-run without any file */
export function buildDemoSheet(): ParsedSheet {
  const rows = DEMO_ROWS.map((values) => {
    const record: Record<string, string> = {}
    SAMPLE_HEADERS.forEach((header, index) => {
      record[header] = values[index] ?? ''
    })
    return record
  })
  return {
    fileName: 'demo-data.xlsx',
    sheetName: 'Employees',
    sheetNames: ['Employees'],
    headers: [...SAMPLE_HEADERS],
    rows,
  }
}

/** Placeholder photos, drawn on a canvas, named exactly like the Emp Codes */
export function buildDemoPhotos(): PhotoEntry[] {
  const palette = ['#19a582', '#0a4d75', '#aa3bff', '#e2582b', '#8a6d00']
  return DEMO_ROWS.map((values, index) => {
    const code = values[0]
    const name = values[1]
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    let dataUrl = ''
    if (ctx) {
      ctx.fillStyle = palette[index % palette.length]
      ctx.fillRect(0, 0, 400, 400)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 150px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initials, 200, 205)
      dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    }
    return { key: normalizeKey(code), name: `${code}.jpg`, dataUrl }
  })
}
