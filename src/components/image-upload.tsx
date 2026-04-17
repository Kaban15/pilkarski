"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

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
  variant?: "avatar" | "cover";
}

export function ImageUpload({ currentUrl, folder, entityId, onUploaded, variant = "avatar" }: ImageUploadProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isCover = variant === "cover";
  const maxSize = isCover ? 1600 : 800;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("Dozwolone tylko pliki graficzne"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t("Maksymalny rozmiar pliku to 5 MB"));
      return;
    }

    setUploading(true);
    setError("");

    const compressed = await compressImage(file, maxSize, 0.8);

    const formData = new FormData();
    formData.append("file", compressed, `${entityId}.webp`);
    formData.append("folder", folder);
    formData.append("entityId", entityId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(t("Błąd uploadu: ") + (data.error ?? t("Nieznany błąd")));
        setUploading(false);
        return;
      }
      setPreview(data.url);
      onUploaded(data.url);
    } catch {
      setError(t("Błąd połączenia z serwerem"));
    }
    setUploading(false);
  }

  if (isCover) {
    return (
      <div className="space-y-2">
        <div className="relative w-full overflow-hidden rounded-xl border bg-gradient-to-br from-violet-500/20 via-slate-500/10 to-orange-500/20 aspect-[16/5]">
          {preview && (
            <img src={preview} alt={t("Zdjęcie tła")} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 flex items-end justify-end p-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? t("Przesyłanie...") : preview ? t("Zmień tło") : t("Dodaj tło")}
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <img
          src={preview}
          alt={t("Zdjęcie")}
          className="h-20 w-20 rounded-full object-cover border"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-secondary text-xs text-muted-foreground">
          {t("Brak")}
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
          {uploading ? t("Przesyłanie...") : preview ? t("Zmień zdjęcie") : t("Dodaj zdjęcie")}
        </Button>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
