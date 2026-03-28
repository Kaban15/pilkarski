import { detectFileType } from "@/lib/file-validation";

describe("detectFileType", () => {
  it("detects JPEG", () => {
    const bytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00]);
    expect(detectFileType(bytes)).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
    expect(detectFileType(bytes)).toBe("image/png");
  });

  it("detects WebP", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectFileType(bytes)).toBe("image/webp");
  });

  it("returns null for unknown bytes", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(detectFileType(bytes)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(detectFileType(new Uint8Array([]))).toBeNull();
  });

  it("returns null for too-short input", () => {
    expect(detectFileType(new Uint8Array([0xFF, 0xD8]))).toBeNull();
  });

  it("rejects RIFF without WEBP marker", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20,
    ]);
    expect(detectFileType(bytes)).toBeNull();
  });
});
