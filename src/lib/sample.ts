import * as XLSX from 'xlsx'
import { downloadBlob } from './image'

export const SAMPLE_HEADERS = [
  'Emp Code',
  'Employee Name',
  'Gender',
  'Blood Group',
  'Designation',
  'Department',
  'Location',
  'Address',
  'Emergency Number',
  'Company Name',
  'Photo File Name',
]

const SAMPLE_ROWS: string[][] = [
  ['EMP001', 'Rahul Sharma', 'Male', 'B+', 'Software Engineer', 'IT', 'Mohali', 'B-103, Bestech Business Tower, Sector 66, Mohali 160062', '+91 8872791500', 'Genius Consultants', 'EMP001.jpg'],
  ['EMP002', 'Priya Verma', 'Female', 'O+', 'HR Executive', 'Human Resource', 'Chandigarh', '7A, Madhya Marg, Sector 7C, Chandigarh 160019', '+91 8872791501', 'Genius Consultants', 'EMP002.jpg'],
  ['EMP003', 'Amit Kumar', 'Male', 'A-', 'Field Officer', 'Operations', 'Ludhiana', 'SCF 84, Grain Market, Gill Road, Ludhiana 141003', '+91 8872791502', 'Genius Consultants', 'EMP003.jpg'],
  ['EMP004', 'Neha Singh', 'Female', 'AB+', 'Accountant', 'Finance', 'Jaipur', 'SP - 636 A2, Road No. 6, VKI Area, Jaipur 302013', '+91 8872791503', 'Genius Consultants', 'EMP004.jpg'],
  ['EMP005', 'Sandeep Yadav', 'Male', 'O-', 'Supervisor', 'Warehouse', 'Hisar', 'Soni Complex, 4th Milestone, Sirsa Road, Hisar 125001', '+91 8872791504', 'Genius Consultants', 'EMP005.jpg'],
]

/** Builds and downloads a ready-to-fill Excel template with the exact column names */
export function downloadSampleWorkbook(): void {
  const sheet = XLSX.utils.aoa_to_sheet([SAMPLE_HEADERS, ...SAMPLE_ROWS])
  sheet['!cols'] = SAMPLE_HEADERS.map((header) => ({ wch: Math.max(14, header.length + 4) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Employees')
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  downloadBlob(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'ID_Card_Employee_Data_Template.xlsx',
  )
}
