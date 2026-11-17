import { baseName, normalizeKey, stripExtension } from './text'

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

/**
 * Downscale an image so that its longest side is at most `maxSize` px.
 * Keeps the JPEG/ZIP size sane when 50-60 cards are generated in one go.
 */
export async function resizeImage(
  dataUrl: string,
  maxSize: number,
  mime: string,
  quality = 0.92,
): Promise<string> {
  try {
    const img = await loadImage(dataUrl)
    const natural = Math.max(img.naturalWidth, img.naturalHeight)
    if (!natural) return dataUrl
    const scale = Math.min(1, maxSize / natural)
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL(mime, quality)
  } catch {
    return dataUrl
  }
}

/** employee photo -> square-ish JPEG data URL */
export async function preparePhoto(file: Blob, name = ''): Promise<{ key: string; name: string; dataUrl: string }> {
  const raw = await fileToDataUrl(file)
  const dataUrl = await resizeImage(raw, 900, 'image/jpeg', 0.92)
  const fileName = name || (file instanceof File ? file.name : 'photo.jpg')
  return { key: normalizeKey(stripExtension(fileName)), name: baseName(fileName), dataUrl }
}

/** company logo -> PNG (keeps transparency) data URL */
export async function prepareLogo(file: Blob): Promise<string> {
  const raw = await fileToDataUrl(file)
  const isPng = /png|svg/i.test(file.type) || /\.png$/i.test(file instanceof File ? file.name : '')
  return resizeImage(raw, 700, isPng ? 'image/png' : 'image/jpeg', 0.95)
}

export function isImageFile(fileName: string): boolean {
  return /\.(jpe?g|png|webp|bmp|gif|avif)$/i.test(fileName)
}

/**
 * Wait until every <img> inside `root` has finished loading, then wait
 * two animation frames so the browser has actually painted the node.
 * Without this html-to-image can export a blank card.
 */
export async function waitForImages(root: HTMLElement | null): Promise<void> {
  if (root) {
    const images = Array.from(root.querySelectorAll('img'))
    await Promise.all(
      images.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            }),
      ),
    )
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  downloadUrl(url, fileName)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function downloadUrl(url: string, fileName: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',')
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/jpeg'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
