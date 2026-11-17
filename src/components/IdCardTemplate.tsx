import { Fragment } from 'react'
import type { Ref } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import type { CardData } from '../types'

interface Props {
  data: CardData
  innerRef?: Ref<HTMLDivElement>
}

/**
 * The printed ID card itself (10.8cm x 17.2cm).
 * The exact same markup is used for the on-screen preview and for the
 * high-resolution JPEG export, so what you see is what you download.
 */
function IdCardTemplate({ data, innerRef }: Props) {
  const theme = useTheme()

  const initials = (data.empName || data.empCode || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

  const footerLines = (data.footerAddress || '').split('\n').filter((line) => line.trim() !== '')
  const hasAddress = Boolean(data.address && data.address.length > 0)

  return (
    <Box
      component="div"
      ref={innerRef}
      sx={{
        py: 1,
        pb: 2,
        background: '#fff',
        height: '17.2cm',
        width: '10.8cm',
        outlineOffset: '3px',
        display: 'flex',
        flexFlow: 'column',
        fontSize: '100%',
        '& .header, & .cardFooter': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: '80px',
          color: '#838383',
          '& .logo': {
            maxWidth: '94%',
            objectFit: 'contain',
          },
        },
        '& .header': {
          flexDirection: 'column',
        },
        '& .logo': {
          height: '60px',
          objectFit: 'contain',
        },
        '& .cardBody': {
          flex: 1,
          display: 'flex',
          flexFlow: 'column',
          alignItems: 'center',
          '& *': {
            fontFamily: `${theme.typography.h1.fontFamily} !important`,
          },
          '& .userImage': {
            mb: 1,
            mt: 2,
            height: '4.5cm',
            width: '4cm',
            objectFit: 'cover',
            borderRadius: '100%',
            border: '1px solid #83838370',
          },
          '& .userName, & .userCode': {
            fontWeight: 600,
            fontSize: '0.55cm',
            color: '#000',
          },
          '& .userCode': {
            fontSize: '0.5cm',
          },
        },
      }}
    >
      <Box className="header">
        {data.logo && <img src={data.logo} alt="logo" className="logo" />}
        <Typography
          className="userName"
          sx={{
            textTransform: 'capitalize',
            fontSize: '0.5cm',
            fontWeight: 600,
            color: '#000',
            fontFamily: `${theme.typography.h1.fontFamily} !important`,
          }}
        >
          {data.companyName}
        </Typography>
      </Box>

      <Box className="cardBody">
        {data.userImage ? (
          <img src={data.userImage} alt="userImage" className="userImage" />
        ) : (
          <Box
            className="userImage"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#e6e6e6',
              color: '#8a8a8a',
              fontSize: '0.9cm',
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            {initials || '--'}
          </Box>
        )}

        <Typography className="userName">{data.empName}</Typography>
        <Typography className="userCode">{data.empCode}</Typography>

        <Box
          sx={{
            my: 1,
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            width: '95%',
            '& .infoSection': {
              flex: 1,
              '&.left': {
                pr: 2,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                borderRight: '1px solid #838383',
              },
              '&.center': {
                whiteSpace: 'nowrap',
                textAlign: 'center',
                px: 1,
              },
              '&.right': {
                whiteSpace: 'nowrap',
                textAlign: 'center',
                pl: 2,
                borderLeft: '1px solid #838383',
              },
              '& .MuiTypography-root': {
                fontWeight: 600,
                mb: 0.5,
                fontSize: '0.4cm',
                lineHeight: '0.6cm',
                color: '#111',
                '& span': {
                  color: '#505050',
                  fontWeight: 500,
                  fontSize: '0.40cm',
                },
              },
            },
          }}
        >
          <Box className="infoSection left">
            <Typography>
              <span>Gender</span>
              <br />
              {data.gender || '-'}
            </Typography>
          </Box>
          <Box className="infoSection center">
            <Typography>
              <span>Blood Group</span>
              <br />
              {data.bloodGroup || '-'}
            </Typography>
          </Box>
          <Box className="infoSection right">
            <Typography>
              <span>Emergency Number</span>
              <br />
              {data.emergencyNumber || '-'}
            </Typography>
          </Box>

          <Box
            className="infoSection"
            sx={{
              minWidth: '100%',
              borderRadius: '12px',
              mt: 2,
              '& .MuiTypography-root': {
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: 1,
                '&.single': {
                  whiteSpace: 'nowrap',
                },
                '& span': {
                  ml: 3,
                  minWidth: '96px',
                },
              },
            }}
          >
            <Typography className="single">
              <span>Designation</span> {data.designation || '-'}
            </Typography>
            <Typography className="single">
              <span>Department</span> {data.department || '-'}
            </Typography>
            <Typography className="single">
              <span>Location</span> {data.location || '-'}
            </Typography>
            {hasAddress && (
              <Typography
                className="line-clamp clamp-2"
                sx={{
                  height: '1.80cm',
                  maxHeight: '1.80cm',
                  alignItems: 'baseline !important',
                  overflow: 'hidden',
                  '& span': { alignSelf: 'flex-start' },
                }}
              >
                <span>Address</span>
                {data.address}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box className="cardFooter">
        <Box
          sx={{
            width: '100%',
            height: '60px',
            display: 'flex',
            flexFlow: 'column',
            gap: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid',
            '& .add': {
              fontFamily: `${theme.typography.h1.fontFamily} !important`,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.42cm',
              lineHeight: '0.6cm',
              color: '#000',
              justifyContent: 'center',
              mb: 0,
            },
          }}
        >
          <Typography className="add">
            {footerLines.length === 0
              ? null
              : footerLines.map((line, index) => (
                  <Fragment key={`${line}-${index}`}>
                    {line}
                    {index < footerLines.length - 1 && <br />}
                  </Fragment>
                ))}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default IdCardTemplate
