import { useMemo, useState } from 'react'
import { AppBar, Box, CssBaseline, Tab, Tabs, ThemeProvider, Toolbar, Typography, createTheme } from '@mui/material'
import BulkGenerator from './BulkGenerator'
import IdCardGenerator from './IdCardGenerator'

function App() {
  const [tab, setTab] = useState(0)

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: '#19a582',
          },
          secondary: {
            main: '#0a4d75',
          },
          background: {
            default: '#f5f7f9',
          },
        },
        typography: {
          h1: { fontFamily: 'Montserrat, sans-serif' },
          h2: { fontFamily: 'Montserrat, sans-serif' },
          h3: { fontFamily: 'Montserrat, sans-serif' },
          h4: { fontFamily: 'Montserrat, sans-serif' },
          h5: { fontFamily: 'Montserrat, sans-serif' },
          h6: { fontFamily: 'Montserrat, sans-serif' },
          button: {
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
          },
          fontFamily: 'Nunito, sans-serif',
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '12px',
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                borderRadius: '16px !important',
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                padding: '6px 14px',
                borderRadius: '10px',
              },
            },
          },
        },
      }),
    [],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            ID Card Generator
          </Typography>
          <Tabs value={tab} onChange={(_event, value: number) => setTab(value)}>
            <Tab label="Bulk Mode (Excel + Photos)" sx={{ textTransform: 'none' }} />
            <Tab label="Single Card" sx={{ textTransform: 'none' }} />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box component="main">{tab === 0 ? <BulkGenerator /> : <IdCardGenerator />}</Box>
    </ThemeProvider>
  )
}

export default App
