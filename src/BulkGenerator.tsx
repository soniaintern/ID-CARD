import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import JSZip from 'jszip'
import IdCardTemplate from './components/IdCardTemplate'
import { EMPTY_COLUMN_MAP, FIELD_LABELS, FIELD_ORDER, REQUIRED_FIELDS, autoDetectColumns } from './lib/columns'
import { buildDemoPhotos, buildDemoSheet } from './lib/demo'
import { dataUrlToBlob, downloadBlob, isImageFile, prepareLogo, preparePhoto } from './lib/image'
import { applyPhoto, countMatched, unusedPhotos } from './lib/match'
import { buildEmployeeRows, parseWorkbook } from './lib/parse'
import type { ParsedSheet } from './lib/parse'
import { downloadSampleWorkbook } from './lib/sample'
import { cardFileName, loadSettings, rowToCard, saveSettings } from './lib/settings'
import { nextTick, timestamp } from './lib/text'
import { HiddenCardExport, useCardExporter } from './lib/useCardExporter'
import type { ColumnMap, CompanySettings, FieldKey, PhotoEntry, RowWithPhoto } from './types'

const FOLDER_PICKER_PROPS = {
  webkitdirectory: 'true',
  directory: 'true',
} as unknown as InputHTMLAttributes<HTMLInputElement>

const TABLE_LIMIT = 300

function BulkGenerator() {
  const [settings, setSettings] = useState<CompanySettings>(() => loadSettings())
  const [sheetFile, setSheetFile] = useState<File | null>(null)
  const [sheet, setSheet] = useState<ParsedSheet | null>(null)
  const [map, setMap] = useState<ColumnMap>({ ...EMPTY_COLUMN_MAP })
  const [parseError, setParseError] = useState('')
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoNote, setPhotoNote] = useState('')
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null)
  const [resultNote, setResultNote] = useState('')
  const [failures, setFailures] = useState<string[]>([])
  const [quality, setQuality] = useState(3)

  const { render, nodeRef, data: exportData } = useCardExporter(quality)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const baseRows = useMemo(
    () => (sheet ? buildEmployeeRows(sheet, map, settings) : []),
    [sheet, map, settings],
  )

  const rows = useMemo(() => baseRows.map((row) => applyPhoto(row, photos)), [baseRows, photos])

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      [row.empCode, row.empName, row.designation, row.department, row.location, row.photoSource]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [rows, search])

  const selectedRows = useMemo(() => rows.filter((row) => selection[row.id]), [rows, selection])
  const matchedPhotos = countMatched(rows)
  const photosWithoutRow = useMemo(() => unusedPhotos(rows, photos), [rows, photos])
  const rowsWithoutPhoto = useMemo(() => rows.filter((row) => !row.photo).length, [rows])

  const updateSetting = (patch: Partial<CompanySettings>) => setSettings((prev) => ({ ...prev, ...patch }))

  /* ------------------------------------------------------------------ sheet */

  const applyParsedSheet = useCallback((parsed: ParsedSheet) => {
    setSheet(parsed)
    setMap(autoDetectColumns(parsed.headers))
    const next: Record<string, boolean> = {}
    parsed.rows.forEach((_, index) => {
      next[`row-${index + 1}`] = true
    })
    setSelection(next)
    setResultNote('')
    setFailures([])
  }, [])

  const loadSheet = useCallback(
    async (file: File, sheetName?: string) => {
      setParseError('')
      try {
        const parsed = await parseWorkbook(file, sheetName)
        setSheetFile(file)
        applyParsedSheet(parsed)
      } catch (error) {
        setSheet(null)
        setParseError((error as Error).message || 'Could not read the file')
      }
    },
    [applyParsedSheet],
  )

  const loadDemoData = () => {
    setParseError('')
    setSheetFile(null)
    applyParsedSheet(buildDemoSheet())
    setPhotos(buildDemoPhotos())
    setPhotoNote('Demo data and 5 sample photos loaded. You can now test the ZIP download.')
  }

  const onSheetPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void loadSheet(file)
  }

  const onSheetChange = (sheetName: string) => {
    if (sheetFile) void loadSheet(sheetFile, sheetName)
  }

  const onLogoPicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const dataUrl = await prepareLogo(file)
    updateSetting({ logo: dataUrl })
  }

  /* ----------------------------------------------------------------- photos */

  const addPhotos = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    setPhotoBusy(true)
    setPhotoNote('Loading photos...')
    try {
      const collected: PhotoEntry[] = []
      const zips = files.filter((file) => /\.zip$/i.test(file.name))
      const images = files.filter((file) => isImageFile(file.name))

      for (const zipFile of zips) {
        const archive = await JSZip.loadAsync(zipFile)
        const entries = Object.values(archive.files).filter((entry) => !entry.dir && isImageFile(entry.name))
        for (const entry of entries) {
          const blob = await entry.async('blob')
          const prepared = await preparePhoto(blob, entry.name)
          if (prepared.key) collected.push(prepared)
        }
      }

      for (let i = 0; i < images.length; i += 1) {
        const prepared = await preparePhoto(images[i], images[i].name)
        if (prepared.key) collected.push(prepared)
        if (i % 10 === 0) setPhotoNote(`Loading photos... ${i + 1}/${images.length}`)
      }

      if (collected.length === 0) {
        setPhotoNote('No images found. Choose JPG / PNG files or a ZIP.')
        return
      }

      setPhotos((prev) => {
        const byKey = new Map(prev.map((item) => [item.key, item]))
        collected.forEach((item) => byKey.set(item.key, item))
        return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name))
      })
      setPhotoNote(`${collected.length} photo(s) loaded.`)
    } catch (error) {
      setPhotoNote(`Photo loading failed: ${(error as Error).message}`)
    } finally {
      setPhotoBusy(false)
    }
  }, [])

  const onPhotosPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void addPhotos(files)
  }

  /* -------------------------------------------------------------- selection */

  const toggleRow = (id: string) => setSelection((prev) => ({ ...prev, [id]: !prev[id] }))

  const setVisibleSelected = (checked: boolean) =>
    setSelection((prev) => {
      const next = { ...prev }
      visibleRows.forEach((row) => {
        next[row.id] = checked
      })
      return next
    })

  /* --------------------------------------------------------------- generate */

  const generate = async (downloadMode: 'zip' | 'files') => {
    const list = selectedRows
    if (list.length === 0) {
      setResultNote('Select at least one row.')
      return
    }
    setBusy(true)
    setFailures([])
    setResultNote('')
    setProgress({ done: 0, total: list.length, label: 'Starting...' })

    const zip = new JSZip()
    const failed: string[] = []
    let made = 0

    try {
      for (let index = 0; index < list.length; index += 1) {
        const row = list[index]
        const label = `${row.empCode || '-'} ${row.empName || ''}`.trim()
        setProgress({ done: index, total: list.length, label: `Creating card: ${label} (${index + 1}/${list.length})` })

        const dataUrl = await render(rowToCard(row, settings))
        if (!dataUrl) {
          failed.push(label)
          setProgress({ done: index + 1, total: list.length, label: `Skipped: ${label}` })
          continue
        }

        const fileName = cardFileName(row)
        if (downloadMode === 'zip') {
          zip.file(fileName, dataUrl.split(',')[1], { base64: true })
        } else {
          downloadBlob(dataUrlToBlob(dataUrl), fileName)
          await new Promise((resolve) => setTimeout(resolve, 400))
        }
        made += 1
        setProgress({ done: index + 1, total: list.length, label: `${index + 1}/${list.length} done` })
        await nextTick()
      }

      if (downloadMode === 'zip' && made > 0) {
        setProgress({ done: list.length, total: list.length, label: 'Preparing the ZIP file...' })
        await nextTick()
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
        downloadBlob(blob, `ID_Cards_${timestamp()}.zip`)
      }

      setResultNote(
        `${made} ID card(s) created${failed.length ? `, ${failed.length} failed` : ''}.` +
          (downloadMode === 'zip' ? ' ZIP download started.' : ' File downloads started.'),
      )
      setFailures(failed)
    } catch (error) {
      setResultNote(`Error while generating: ${(error as Error).message}`)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const previewRow: RowWithPhoto | undefined = selectedRows[0] ?? rows[0]

  /* ------------------------------------------------------------------ render */

  return (
    <Box sx={{ width: '100%', maxWidth: '1180px', mx: 'auto', px: 2, py: 3, textAlign: 'left' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Bulk ID Card Generator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload an Excel / CSV file, select all employee photos at once, and download 50-60 ID cards in one click.
        No need to enter data one by one.
      </Typography>

      {/* ---------------------------------------------------------- step 1 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          1. Company details (same on all cards)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Company Name"
            value={settings.companyName}
            onChange={(event) => updateSetting({ companyName: event.target.value })}
            sx={{ width: 260 }}
          />
          <TextField
            size="small"
            label="Default Emergency Number"
            value={settings.emergencyNumber}
            onChange={(event) => updateSetting({ emergencyNumber: event.target.value })}
            sx={{ width: 240 }}
          />
          <Button variant="outlined" component="label" sx={{ textTransform: 'none' }}>
            {settings.logo ? 'Change logo' : 'Upload company logo'}
            <input hidden type="file" accept="image/*" onChange={(event) => void onLogoPicked(event)} />
          </Button>
          {settings.logo && (
            <>
              <Box component="img" src={settings.logo} alt="logo" sx={{ height: 40, alignSelf: 'center' }} />
              <Button size="small" onClick={() => updateSetting({ logo: '' })} sx={{ textTransform: 'none' }}>
                Remove logo
              </Button>
            </>
          )}
        </Box>
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          label="Footer Address (printed at the bottom of every card)"
          value={settings.footerAddress}
          onChange={(event) => updateSetting({ footerAddress: event.target.value })}
          sx={{ mt: 2 }}
        />
      </Paper>

      {/* ---------------------------------------------------------- step 2 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          2. Upload employee data file (Excel / CSV)
        </Typography>

        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
            Choose Excel / CSV
            <input hidden type="file" accept=".xlsx,.xls,.csv,text/csv" onChange={onSheetPicked} />
          </Button>
          <Button variant="outlined" onClick={downloadSampleWorkbook} sx={{ textTransform: 'none' }}>
            Sample Excel template download
          </Button>
          <Button variant="text" onClick={loadDemoData} sx={{ textTransform: 'none' }}>
            Load demo data (5 test cards)
          </Button>
          {sheet && (
            <Chip
              color="success"
              variant="outlined"
              label={`${sheet.fileName} - ${sheet.rows.length} rows`}
              onDelete={() => {
                setSheet(null)
                setSheetFile(null)
                setSelection({})
              }}
            />
          )}
        </Stack>

        {parseError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {parseError}
          </Alert>
        )}

        {sheet && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Column mapping
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Columns were auto-detected. If anything looks wrong, change it from the dropdowns below.
              </Typography>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 1.5, mt: 1.5 }}>
              {FIELD_ORDER.map((field: FieldKey) => (
                <FormControl key={field} size="small" fullWidth error={REQUIRED_FIELDS.includes(field) && !map[field]}>
                  <InputLabel>{FIELD_LABELS[field]}</InputLabel>
                  <Select
                    label={FIELD_LABELS[field]}
                    value={map[field]}
                    onChange={(event) => setMap((prev) => ({ ...prev, [field]: event.target.value }))}
                  >
                    <MenuItem value="">
                      <em>(leave empty)</em>
                    </MenuItem>
                    {sheet.headers.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Box>

            {sheet.sheetNames.length > 1 && (
              <FormControl size="small" sx={{ mt: 2, minWidth: 220 }}>
                <InputLabel>Sheet</InputLabel>
                <Select label="Sheet" value={sheet.sheetName} onChange={(event) => onSheetChange(event.target.value)}>
                  {sheet.sheetNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        )}
      </Paper>

      {/* ---------------------------------------------------------- step 3 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          3. Upload employee photos
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Name each photo after the Emp Code or Employee Name (e.g. <code>EMP001.jpg</code> or{' '}
          <code>Rahul Sharma.jpg</code>). You can also upload all photos in one ZIP file - matching is automatic.
        </Typography>

        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="contained" component="label" disabled={photoBusy} sx={{ textTransform: 'none' }}>
            Choose photos (multiple)
            <input hidden type="file" multiple accept="image/*,.zip" onChange={onPhotosPicked} />
          </Button>
          <Button variant="outlined" component="label" disabled={photoBusy} sx={{ textTransform: 'none' }}>
            Choose folder
            <input hidden type="file" multiple accept="image/*" {...FOLDER_PICKER_PROPS} onChange={onPhotosPicked} />
          </Button>
          {photos.length > 0 && (
            <Chip
              variant="outlined"
              label={`${photos.length} photo(s) loaded`}
              onDelete={() => {
                setPhotos([])
                setPhotoNote('')
              }}
            />
          )}
        </Stack>

        {photoBusy && <LinearProgress sx={{ mt: 2 }} />}
        {photoNote && (
          <Alert severity={photoNote.includes('failed') || photoNote.includes('No images') ? 'warning' : 'info'} sx={{ mt: 2 }}>
            {photoNote}
          </Alert>
        )}

        <Typography variant="body2" sx={{ mt: 1.5 }}>
          Photo matched: <strong>{matchedPhotos}</strong> / {rows.length}
          {rowsWithoutPhoto > 0 && ` - ${rowsWithoutPhoto} row(s) without a photo`}
          {photosWithoutRow.length > 0 && ` - ${photosWithoutRow.length} photo(s) not matched to any row`}
        </Typography>

        {photosWithoutRow.length > 0 && (
          <Tooltip title={photosWithoutRow.slice(0, 40).map((photo) => photo.name).join(', ')}>
            <Typography variant="caption" color="text.secondary" sx={{ cursor: 'help' }}>
              Hover to see the unmatched photos
            </Typography>
          </Tooltip>
        )}
      </Paper>

      {/* ---------------------------------------------------------- step 4 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          4. Generate and download cards
        </Typography>

        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Image quality</InputLabel>
            <Select
              label="Image quality"
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              disabled={busy}
            >
              <MenuItem value={2}>Standard (150 dpi)</MenuItem>
              <MenuItem value={3}>High (225 dpi) - recommended</MenuItem>
              <MenuItem value={4}>Ultra (300 dpi) - slow</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="large"
            disabled={busy || selectedRows.length === 0}
            onClick={() => void generate('zip')}
            sx={{ textTransform: 'none' }}
          >
            {busy ? 'Creating...' : `Download ZIP (${selectedRows.length} cards)`}
          </Button>
          <Button
            variant="outlined"
            disabled={busy || selectedRows.length === 0}
            onClick={() => void generate('files')}
            sx={{ textTransform: 'none' }}
          >
            Download separate JPEGs
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          ZIP is recommended - even 60 cards come in a single file. With "Download separate JPEGs" the browser may
          block many files downloaded at once.
        </Typography>

        {progress && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress.total ? Math.round((progress.done / progress.total) * 100) : 0}
            />
            <Typography variant="caption" color="text.secondary">
              {progress.label}
            </Typography>
          </Box>
        )}

        {resultNote && (
          <Alert severity={failures.length ? 'warning' : 'success'} sx={{ mt: 2 }}>
            {resultNote}
          </Alert>
        )}

        {failures.length > 0 && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            Fail hui rows: {failures.join(', ')}
          </Typography>
        )}
      </Paper>

      {/* ----------------------------------------------------------- table */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Data preview ({rows.length} rows)
          </Typography>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: 220 }}
          />
          <Button size="small" onClick={() => setVisibleSelected(true)} sx={{ textTransform: 'none' }}>
            Select all
          </Button>
          <Button size="small" onClick={() => setVisibleSelected(false)} sx={{ textTransform: 'none' }}>
            Clear selection
          </Button>
          <Chip size="small" color="primary" variant="outlined" label={`${selectedRows.length} selected`} />
        </Stack>

        {rows.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No data loaded yet. Upload an Excel / CSV file in Step 2.
          </Typography>
        )}

        {rows.length > 0 && (
          <>
            <TableContainer sx={{ maxHeight: 460 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={visibleRows.length > 0 && visibleRows.every((row) => selection[row.id])}
                        indeterminate={
                          visibleRows.some((row) => selection[row.id]) &&
                          !visibleRows.every((row) => selection[row.id])
                        }
                        onChange={(event) => setVisibleSelected(event.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Photo</TableCell>
                    <TableCell>Emp Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Blood</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.slice(0, TABLE_LIMIT).map((row) => (
                    <TableRow key={row.id} hover selected={Boolean(selection[row.id])}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={Boolean(selection[row.id])}
                          onChange={() => toggleRow(row.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {row.photo ? (
                          <Box
                            component="img"
                            src={row.photo}
                            alt={row.empName}
                            sx={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Chip size="small" label="no photo" color="warning" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{row.empCode || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.empName || '-'}</TableCell>
                      <TableCell>{row.gender || '-'}</TableCell>
                      <TableCell>{row.bloodGroup || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.designation || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.department || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.location || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.issues.length === 0 ? (
                          <Typography variant="caption" color="success.main">
                            OK
                          </Typography>
                        ) : (
                          <Tooltip title={row.issues.join(' | ')}>
                            <Typography variant="caption" color="warning.main" sx={{ cursor: 'help' }}>
                              {row.issues.length} warning
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {visibleRows.length > TABLE_LIMIT && (
              <Typography variant="caption" color="text.secondary">
                Showing the first {TABLE_LIMIT} rows. All {selectedRows.length} selected rows will be included in the download.
              </Typography>
            )}
          </>
        )}
      </Paper>

      {/* --------------------------------------------------------- preview */}
      {previewRow && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Live preview (first selected card)
          </Typography>
          <Box sx={{ height: '320px', overflow: 'hidden' }}>
            <Box sx={{ transform: 'scale(0.45)', transformOrigin: 'top left' }}>
              <IdCardTemplate data={rowToCard(previewRow, settings)} />
            </Box>
          </Box>
        </Paper>
      )}

      <HiddenCardExport data={exportData} nodeRef={nodeRef} />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Tip: creating 50-60 cards at once can take 1-3 minutes. Do not close the page until it finishes.
      </Typography>
    </Box>
  )
}

export default BulkGenerator
