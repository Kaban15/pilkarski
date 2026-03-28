/**
 * Detect image file type from magic bytes.
 * Returns MIME type string or null if not a recognized image.
 */
export function detectFileType(bytes: Uint8Array): string | null {
  if (bytes.length < 3) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "image/png";
  }

  // WebP: RIFF....WEBP (bytes 0-3: RIFF, bytes 8-11: WEBP)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
