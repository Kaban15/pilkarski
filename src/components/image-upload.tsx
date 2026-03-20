"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

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

    if (file.size > 2 * 1024 * 1024) {
      setError("Maksymalny rozmiar pliku to 2 MB");
      return;
    }

    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const path = `${folder}/${entityId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Błąd uploadu: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = data.publicUrl + "?t=" + Date.now();

    setPreview(publicUrl);
    onUploaded(publicUrl);
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-gray-100 text-xs text-gray-400">
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
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
