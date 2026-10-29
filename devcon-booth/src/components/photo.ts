// Phone cameras produce photos larger than Domino's 5 MB upload limit, so big
// pictures are re-encoded in the browser before they are sent. Similarity
// checks compare perceptual hashes, which survive resizing.

const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024
const MAX_EDGE = 2560

/** The file to upload: the original when it is small enough, else a resized JPEG. */
export async function preparePhoto(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) {
    return file
  }
  const blob = await draw(file, MAX_EDGE, false, 0.88)
  return blob ? new File([blob], "selfie.jpg", { type: "image/jpeg" }) : file
}

/** A small square JPEG data URL, kept so a reload can still show the selfie. */
export async function thumbnail(file: File): Promise<string | null> {
  const blob = await draw(file, 480, true, 0.8)
  if (!blob) {
    return null
  }
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

async function draw(
  file: File,
  edge: number,
  square: boolean,
  quality: number
): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = square ? (bitmap.width - side) / 2 : 0
    const sy = square ? (bitmap.height - side) / 2 : 0
    const sw = square ? side : bitmap.width
    const sh = square ? side : bitmap.height
    const scale = Math.min(1, edge / Math.max(sw, sh))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(sw * scale)
    canvas.height = Math.round(sh * scale)
    canvas.getContext("2d")?.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
  } catch {
    return null
  }
}
