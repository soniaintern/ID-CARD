import { useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import IdCardTemplate from './components/IdCardTemplate'
import { dataUrlToBlob, downloadBlob, prepareLogo, preparePhoto } from './lib/image'
import { cardFileName, loadSettings } from './lib/settings'
import { normalizeBloodGroup, normalizeGender } from './lib/text'
import { HiddenCardExport, useCardExporter } from './lib/useCardExporter'
import type { CardData } from './types'

interface FormState {
  companyName: string
  logo: string
  empName: string
  userImage: string
  empCode: string
  location: string
  gender: string
  bloodGroup: string
  designation: string
  department: string
  localAddress: string
  emergencyNumber: string
  footerAddress: string
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

function IdCardGenerator() {
  const [form, setForm] = useState<FormState>(() => {
    const settings = loadSettings()
    return {
      companyName: settings.companyName,
      logo: settings.logo,
      empName: '',
      userImage: '',
      empCode: '',
      location: '',
      gender: '',
      bloodGroup: '',
      designation: '',
      department: '',
      localAddress: '',
      emergencyNumber: settings.emergencyNumber,
      footerAddress: settings.footerAddress,
    }
  })
  const [downloading, setDownloading] = useState(false)
  const [note, setNote] = useState('')
  const [quality, setQuality] = useState(3)

  const { render, nodeRef, data: exportData } = useCardExporter(quality)

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

  const cardData: CardData = {
    companyName: form.companyName,
    logo: form.logo,
    empName: form.empName,
    empCode: form.empCode,
    gender: normalizeGender(form.gender),
    bloodGroup: normalizeBloodGroup(form.bloodGroup),
    emergencyNumber: form.emergencyNumber,
    designation: form.designation,
    department: form.department,
    location: form.location,
    address: form.localAddress,
    userImage: form.userImage,
    footerAddress: form.footerAddress,
  }

  const downloadIdCard = async () => {
    if (!form.empName.trim() && !form.empCode.trim()) {
      setNote('Enter the Employee Name or Emp Code.')
      return
    }
    setDownloading(true)
    setNote('')
    try {
      const dataUrl = await render(cardData)
      if (!dataUrl) {
        setNote('Could not create the card, please try again.')
        return
      }
      downloadBlob(dataUrlToBlob(dataUrl), cardFileName(form))
      setNote(`${cardFileName(form)} downloaded.`)
    } finally {
      setDownloading(false)
    }
  }

  const onLogoPicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) update({ logo: await prepareLogo(file) })
  }

  const onPhotoPicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const prepared = await preparePhoto(file, file.name)
    update({ userImage: prepared.dataUrl })
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start', p: 2, textAlign: 'left' }}>
      <Box sx={{ flex: '1 1 340px', maxWidth: 420 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Single ID Card
        </Typography>

        <Grid container columnSpacing={2} rowSpacing={2}>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              label="Company Name"
              value={form.companyName}
              onChange={(event) => update({ companyName: event.target.value })}
            />
          </Grid>
          <Grid size={12}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none' }}>
                {form.logo ? 'Change logo' : 'Company Logo'}
                <input hidden type="file" accept="image/*" onChange={(event) => void onLogoPicked(event)} />
              </Button>
              {form.logo && <Box component="img" src={form.logo} alt="logo" sx={{ height: 32 }} />}
            </Stack>
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              label="Employee Name"
              value={form.empName}
              onChange={(event) => update({ empName: event.target.value })}
            />
          </Grid>
          <Grid size={12}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none' }}>
                {form.userImage ? 'Change photo' : 'Employee Photo'}
                <input hidden type="file" accept="image/*" onChange={(event) => void onPhotoPicked(event)} />
              </Button>
              {form.userImage && (
                <Box
                  component="img"
                  src={form.userImage}
                  alt="employee"
                  sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
            </Stack>
          </Grid>
          <Grid size={5}>
            <TextField
              fullWidth
              size="small"
              label="Emp Code"
              value={form.empCode}
              onChange={(event) => update({ empCode: event.target.value })}
            />
          </Grid>
          <Grid size={7}>
            <TextField
              fullWidth
              size="small"
              label="Location"
              value={form.location}
              onChange={(event) => update({ location: event.target.value })}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Gender"
              value={form.gender}
              onChange={(event) => update({ gender: event.target.value })}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Blood Group"
              value={form.bloodGroup}
              onChange={(event) => update({ bloodGroup: event.target.value })}
            >
              {BLOOD_GROUPS.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              label="Designation"
              value={form.designation}
              onChange={(event) => update({ designation: event.target.value })}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              label="Department"
              value={form.department}
              onChange={(event) => update({ department: event.target.value })}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              label="Emergency Number"
              value={form.emergencyNumber}
              onChange={(event) => update({ emergencyNumber: event.target.value })}
            />
          </Grid>
          <Grid size={12}>
            <Autocomplete
              value={form.localAddress || null}
              onChange={(_event, newValue: string | null) => update({ localAddress: newValue ?? '' })}
              options={localAddresses}
              fullWidth
              isOptionEqualToValue={(option, value) => option === value}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Branch Address" placeholder="Select address" />
              )}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="Footer Address"
              value={form.footerAddress}
              onChange={(event) => update({ footerAddress: event.target.value })}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              size="small"
              label="Image quality"
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
            >
              <MenuItem value={2}>Standard</MenuItem>
              <MenuItem value={3}>High (recommended)</MenuItem>
              <MenuItem value={4}>Ultra</MenuItem>
            </TextField>
          </Grid>
          <Grid size={12}>
            <Button
              variant="contained"
              fullWidth
              disabled={downloading}
              sx={{ textTransform: 'none' }}
              onClick={() => void downloadIdCard()}
            >
              {downloading ? 'Downloading...' : 'Download ID Card'}
            </Button>
          </Grid>
        </Grid>

        {note && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {note}
          </Alert>
        )}
      </Box>

      <Box sx={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Box sx={{ height: '430px', overflow: 'hidden' }}>
            <Box sx={{ transform: 'scale(0.62)', transformOrigin: 'top left' }}>
              <IdCardTemplate data={cardData} />
            </Box>
          </Box>
        </Paper>
      </Box>

      <HiddenCardExport data={exportData} nodeRef={nodeRef} />
    </Box>
  )
}

export default IdCardGenerator

const localAddresses = [
  'Mauza Pahari, Masaurhi Road, Jakariapur, Patna 800007',
  '7A, Madhya Marg, Sector 7C, Chandigarh 160019',
  'Plot No. 776, Near PNB, Kishangarh, Chandigarh 160101',
  'Soni Complex, 4th Milestone, Sirsa Road, Hisar 125001',
  'Parkash Complex, 10th Milestone, Sirsa Road, Hisar 125052',
  'General & Allied Complex, GT Road, Karnal 132001',
  'VPO Baragaon, Gheer Road, Karnal 132023',
  'Kheri Manajat, Kundli, Sonipat 131103',
  'Nathupur, Sonipat 131029',
  'Khadgaon Road, Lava, Wadi, Nagpur. 440023',
  'A.B Road, Dewas Naka, Indore 452010',
  'Plot No. 57, JRG Logistics Park, Dakachaya A.B.Road, Indore 453771',
  'Gupta Warehouse, Oriya, Jabalpur 482002',
  'Ganpati Complex, Malout Road, Bathinda 151001',
  'Bhagwati Compound, Malerkotla Road, Alamgir, Ludhiana 141116',
  'SCF 84, Grain Market, Gill Road, Ludhiana 141003',
  'Samra Logistics Park, Kohara Road, Sahnewal(Ludhiana) 141120',
  'Creative Warehouse, Malerkotala Road, Sarinh, Ludhiana 141116',
  'Bhagwati Warehouse, Malerkotla Road, Kaind, Ludhiana 141116',
  `B-103, Bestech Business Tower 'B', Sector 66, Mohali 160062`,
  'Frontier Complex, Pabhat, Zirakpur - 140603',
  'SP - 636 A2, Road No. 6, VKI Area, Jaipur 302013',
  'Plot No. 01, Salawas Road, Tanawara, Jodhpur 342802',
  'Agro Food Park - II, RICCO, Ranpur, Kota 325003',
  'Adlakha Complex, Bhurarani, Rudarpur 263153',
  'Bhoora Road, Bilwa Thana, Bhojipura, Bareilly 243202',
  'Parsakhera Indl Area, Road No.1, Bareilly 243502',
  'Reliance Road, Bhovapur(Hapur) 245304',
  'Khasra No. 938, Morta, Meerut Road, Ghaziabad, 202003',
  'Amausi Industrial Area, Nadarganj, Lucknow 226008',
  'F-06 Vidya Complex Naity Road, Basai, Uttarpara, Hoogly 712234',
  'P-6, Prime Industrial Area and Logistics Park, Hariyala, Kheda 387570',
  'Empowerers City, 275, West End Marg, New Delhi',
  'Khasra No 421 Village Naryal ,Sector 4 Parwanoo, Distt. Solan (H.P)',
]
