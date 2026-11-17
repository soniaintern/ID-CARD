import type { ColumnMap, FieldKey } from '../types'
import { normalizeKey } from './text'

export const FIELD_LABELS: Record<FieldKey, string> = {
  empCode: 'Emp Code',
  empName: 'Employee Name',
  gender: 'Gender',
  bloodGroup: 'Blood Group',
  designation: 'Designation',
  department: 'Department',
  location: 'Location',
  address: 'Address',
  emergencyNumber: 'Emergency Number',
  companyName: 'Company Name',
  photo: 'Photo File Name',
}

export const FIELD_ORDER: FieldKey[] = [
  'empCode',
  'empName',
  'gender',
  'bloodGroup',
  'designation',
  'department',
  'location',
  'address',
  'emergencyNumber',
  'companyName',
  'photo',
]

export const REQUIRED_FIELDS: FieldKey[] = ['empName']

/**
 * Header aliases - checked in order, so the first alias wins.
 * Matching is done on the normalized header (lowercase, a-z0-9 only),
 * so "Emp Code", "emp_code", "Employee Code" all work.
 */
export const FIELD_ALIASES: Record<FieldKey, string[]> = {
  empCode: ['empcode', 'employeecode', 'employeeno', 'empno', 'empid', 'employeeid', 'code', 'cardno', 'cardnumber', 'id'],
  empName: ['empname', 'employeename', 'nameoftheemployee', 'fullname', 'staffname', 'name', 'employee'],
  gender: ['gender', 'sex'],
  bloodGroup: ['bloodgroup', 'bloodgrp', 'bloodgroupofemployee', 'bg', 'blood'],
  designation: ['designation', 'desg', 'jobtitle', 'title', 'position', 'post', 'role', 'design'],
  department: ['department', 'dept', 'division'],
  location: ['location', 'branch', 'office', 'site', 'unit', 'plant', 'city'],
  address: ['address', 'localaddress', 'branchaddress', 'fulladdress', 'addressline', 'addr', 'postaladdress'],
  emergencyNumber: [
    'emergencynumber',
    'emergencycontact',
    'emergencyno',
    'emergencycontactnumber',
    'emergency',
    'contactnumber',
    'mobilenumber',
    'mobileno',
    'phoneno',
    'contact',
    'phone',
    'mobile',
  ],
  companyName: ['companyname', 'company', 'organization', 'organisation', 'employer', 'firm', 'org'],
  photo: ['photofilename', 'photofile', 'photo', 'imagefilename', 'imagefile', 'image', 'picture', 'pic', 'filename', 'file'],
}

export const EMPTY_COLUMN_MAP: ColumnMap = {
  empCode: '',
  empName: '',
  gender: '',
  bloodGroup: '',
  designation: '',
  department: '',
  location: '',
  address: '',
  emergencyNumber: '',
  companyName: '',
  photo: '',
}

/** Try to guess which sheet column belongs to which card field */
export function autoDetectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = { ...EMPTY_COLUMN_MAP }
  const used = new Set<string>()

  for (const field of FIELD_ORDER) {
    const aliases = FIELD_ALIASES[field]
    let bestHeader = ''
    let bestScore = Number.MAX_SAFE_INTEGER

    for (const header of headers) {
      if (!header || used.has(header)) continue
      const key = normalizeKey(header)
      if (!key) continue
      if (field === 'empName' && key.includes('company')) continue

      const exact = aliases.indexOf(key)
      if (exact >= 0 && exact < bestScore) {
        bestScore = exact
        bestHeader = header
        continue
      }
      const partial = aliases.findIndex((alias) => key.includes(alias) || alias.includes(key))
      if (partial >= 0) {
        const score = aliases.length + partial
        if (score < bestScore) {
          bestScore = score
          bestHeader = header
        }
      }
    }

    if (bestHeader) {
      used.add(bestHeader)
      map[field] = bestHeader
    }
  }

  return map
}
