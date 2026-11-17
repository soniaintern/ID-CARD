import * as XLSX from 'xlsx'
import type { ColumnMap, CompanySettings, EmployeeRow } from '../types'
import { FIELD_LABELS } from './columns'
import { cleanCell, normalizeBloodGroup, normalizeGender } from './text'

export interface ParsedSheet {
  /** file name that was uploaded */
  fileName: string
  /** sheet name that was read */
  sheetName: string
  /** sheet names available in the workbook */
  sheetNames: string[]
  headers: string[]
  /** every data row, keyed by the header text */
  rows: Record<string, string>[]
}

function buildHeaders(raw: unknown[]): string[] {
  const seen = new Map<string, number>()
  return raw.map((cell, index) => {
    const text = cleanCell(cell) || `Column ${index + 1}`
    const count = seen.get(text) ?? 0
    seen.set(text, count + 1)
    return count === 0 ? text : `${text} (${count + 1})`
  })
}

function isBlank(values: string[]): boolean {
  return values.every((value) => !String(value ?? '').trim())
}

function toSheet(fileName: string, wb: XLSX.WorkBook, sheetName: string): ParsedSheet {
  const sheet = wb.Sheets[sheetName]
  if (!sheet) throw new Error(`Sheet "${sheetName}" is empty`)
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  }) as unknown as unknown[][]

  const cleaned = matrix.map((row) => (Array.isArray(row) ? row.map(cleanCell) : []))
  const headerIndex = cleaned.findIndex((row) => row.filter((cell) => cell !== '').length >= 2)
  if (headerIndex < 0) throw new Error('No header row found in the sheet (at least 2 columns are needed)')

  const headers = buildHeaders(cleaned[headerIndex])
  const rows: Record<string, string>[] = []
  for (let i = headerIndex + 1; i < cleaned.length; i += 1) {
    const values = cleaned[i]
    if (!values || isBlank(values)) continue
    const record: Record<string, string> = {}
    headers.forEach((header, columnIndex) => {
      record[header] = values[columnIndex] ?? ''
    })
    rows.push(record)
  }

  return { fileName, sheetName, sheetNames: wb.SheetNames, headers, rows }
}

/** Read an .xlsx / .xls / .csv file and return the first usable sheet */
export async function parseWorkbook(file: File, sheetName?: string): Promise<ParsedSheet> {
  const isCsv = /\.csv$/i.test(file.name) || /csv/i.test(file.type)
  let wb: XLSX.WorkBook

  if (isCsv) {
    const text = await file.text()
    wb = XLSX.read(text, { type: 'string', raw: false })
  } else {
    const buffer = await file.arrayBuffer()
    wb = XLSX.read(buffer, { type: 'array', raw: false })
  }

  const target = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0]
  if (!target) throw new Error('No sheet found in the file')
  return toSheet(file.name, wb, target)
}

export function pickValue(row: Record<string, string>, header: string): string {
  if (!header) return ''
  return cleanCell(row[header])
}

/** Turn raw sheet rows into card rows, using the currently selected column mapping */
export function buildEmployeeRows(
  sheet: ParsedSheet,
  map: ColumnMap,
  settings: CompanySettings,
): EmployeeRow[] {
  const missingRequired = (['empName'] as const).some((field) => !map[field])

  return sheet.rows.map((raw, index) => {
    const gender = normalizeGender(pickValue(raw, map.gender))
    const bloodGroup = normalizeBloodGroup(pickValue(raw, map.bloodGroup))
    const row: EmployeeRow = {
      id: `row-${index + 1}`,
      empCode: pickValue(raw, map.empCode),
      empName: pickValue(raw, map.empName),
      gender,
      bloodGroup,
      designation: pickValue(raw, map.designation),
      department: pickValue(raw, map.department),
      location: pickValue(raw, map.location),
      address: pickValue(raw, map.address),
      emergencyNumber: pickValue(raw, map.emergencyNumber) || settings.emergencyNumber,
      companyName: pickValue(raw, map.companyName) || settings.companyName,
      photoName: pickValue(raw, map.photo),
      issues: [],
    }

    if (missingRequired) row.issues.push(`"${FIELD_LABELS.empName}" column is not selected`)
    if (!row.empName) row.issues.push('Employee Name is empty')
    if (!row.empCode) row.issues.push('Emp Code is empty')
    return row
  })
}
