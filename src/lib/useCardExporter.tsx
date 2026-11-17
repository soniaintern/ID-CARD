import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Box } from '@mui/material'
import { toJpeg } from 'html-to-image'
import IdCardTemplate from '../components/IdCardTemplate'
import type { CardData } from '../types'
import { waitForImages } from './image'

interface Exporter {
  /** Draws `card` off-screen and returns a high-resolution JPEG data URL */
  render: (card: CardData) => Promise<string | null>
  /** Ref of the off-screen node that is being captured */
  nodeRef: RefObject<HTMLDivElement | null>
  /** Card data currently mounted off-screen */
  data: CardData | null
}

/**
 * Shared export engine: keeps one full-size card mounted off-screen and
 * rasterises it with html-to-image. Used by both the single and the bulk mode.
 */
export function useCardExporter(pixelRatio: number): Exporter {
  const [data, setData] = useState<CardData | null>(null)
  const [tick, setTick] = useState(0)
  const nodeRef = useRef<HTMLDivElement>(null)
  const commitRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const resolve = commitRef.current
    commitRef.current = null
    if (resolve) resolve()
  }, [tick])

  const waitForCommit = () =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        commitRef.current = null
        resolve()
      }, 4000)
      commitRef.current = () => {
        clearTimeout(timer)
        resolve()
      }
    })

  const render = useCallback(
    async (card: CardData): Promise<string | null> => {
      setData(card)
      setTick((value) => value + 1)
      await waitForCommit()

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const node = nodeRef.current
        if (!node) return null
        await waitForImages(node)
        try {
          const url = await toJpeg(node, {
            quality: 0.95,
            pixelRatio,
            backgroundColor: '#ffffff',
            cacheBust: false,
            skipFonts: true,
          })
          if (url && url.length > 3000) return url
        } catch {
          // html-to-image occasionally fails on the very first call - retry
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      return null
    },
    [pixelRatio],
  )

  return { render, nodeRef, data }
}

/**
 * Renders the card that is currently being exported. Kept off-screen but
 * NOT display:none, so it still has a real layout for html-to-image.
 */
export function HiddenCardExport({ data, nodeRef }: { data: CardData | null; nodeRef: RefObject<HTMLDivElement | null> }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        left: '-22000px',
        top: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      {data && <IdCardTemplate data={data} innerRef={nodeRef} />}
    </Box>
  )
}
