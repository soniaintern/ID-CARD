export interface CompanySettings {
  /** Company name printed on every card */
  companyName: string
  /** Company logo as data URL (applied to every card) */
  logo: string
  /** Footer address (multi-line) printed at the bottom of every card */
  footerAddress: string
  /** Default emergency number used when the sheet has no such column */
  emergencyNumber: string
}

/** One row of the uploaded Excel / CSV sheet, resolved to card fields */
export interface EmployeeRow {
  id: string
  empCode: string
  empName: string
  gender: string
  bloodGroup: string
  designation: string
  department: string
  location: string
  address: string
  emergencyNumber: string
  companyName: string
  /** Raw value of the "photo" column in the sheet (usually a file name) */
  photoName: string
  issues: string[]
}

/** A row plus its resolved photo (data URL) */
export interface RowWithPhoto extends EmployeeRow {
  photo: string
  photoSource: string
}

/** Everything needed to draw one card */
export interface CardData {
  companyName: string
  logo: string
  empName: string
  empCode: string
  gender: string
  bloodGroup: string
  emergencyNumber: string
  designation: string
  department: string
  location: string
  address: string
  userImage: string
  footerAddress: string
}

export type FieldKey =
  | 'empCode'
  | 'empName'
  | 'gender'
  | 'bloodGroup'
  | 'designation'
  | 'department'
  | 'location'
  | 'address'
  | 'emergencyNumber'
  | 'companyName'
  | 'photo'

export type ColumnMap = Record<FieldKey, string>

export interface PhotoEntry {
  /** normalized file name (lowercase, alphanumeric only) without extension */
  key: string
  /** original file name, shown in the UI */
  name: string
  dataUrl: string
}
