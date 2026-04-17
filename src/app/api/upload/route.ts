import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { createClient } from "@supabase/supabase-js";
import { detectFileType } from "@/lib/file-validation";
import { env } from "@/env";

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const ALLOWED_FOLDERS = ["clubs", "players", "coaches", "events", "clubs-covers"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;
  const entityId = formData.get("entityId") as string | null;

  if (!file || !folder || !entityId) {
    return NextResponse.json({ error: "Missing file, folder, or entityId" }, { status: 400 });
  }

  if (!(ALLOWED_FOLDERS as readonly string[]).includes(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  if (!UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Invalid entityId" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size is 5 MB" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 12));
  const detectedType = detectFileType(headerBytes);

  if (!detectedType) {
    return NextResponse.json(
      { error: "Nieprawidłowy format pliku. Dozwolone: JPEG, PNG, WebP." },
      { status: 400 }
    );
  }

  const path = `${folder}/${entityId}.webp`;
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl + "?t=" + Date.now() });
}
