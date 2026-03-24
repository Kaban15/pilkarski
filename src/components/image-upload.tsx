"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

function compressImage(file: File, maxSize: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/webp",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

interface ImageUploadProps {
  currentUrl: string | null;
  folder: string;
  entityId: string;
  onUploaded: (url: string) => void;
}

export function ImageUpload({ currentUrl, folder, entityId, onUploaded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Dozwolone tylko pliki graficzne");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Maksymalny rozmiar pliku to 5 MB");
      return;
    }

    setUploading(true);
    setError("");

    // Client-side resize & compress (max 800x800, WebP quality 0.8)
    const compressed = await compressImage(file, 800, 0.8);

    const formData = new FormData();
    formData.append("file", compressed, `${entityId}.webp`);
    formData.append("folder", folder);
    formData.append("entityId", entityId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError("Błąd uploadu: " + (data.error ?? "Nieznany błąd"));
        setUploading(false);
        return;
      }
      setPreview(data.url);
      onUploaded(data.url);
    } catch {
      setError("Błąd połączenia z serwerem");
    }
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <img
          src={preview}
          alt="Zdjęcie"
          className="h-20 w-20 rounded-full object-cover border"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-secondary text-xs text-muted-foreground">
          Brak
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Przesyłanie..." : preview ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
        </Button>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
