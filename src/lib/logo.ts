import { LOGO_MIME_TYPES, MAX_LOGO_BYTES } from "@/lib/validators";

export async function parseClubLogo(
  file: FormDataEntryValue | null,
): Promise<{ ok: true; src: string | null } | { ok: false; message: string }> {
  if (!file || typeof file === "string") {
    return { ok: true, src: null };
  }
  if (file.size === 0) {
    return { ok: true, src: null };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: "Logo tối đa 500KB" };
  }
  const mime = file.type;
  if (!(LOGO_MIME_TYPES as readonly string[]).includes(mime)) {
    return { ok: false, message: "Logo phải là JPEG, PNG hoặc WebP" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const src = `data:${mime};base64,${buffer.toString("base64")}`;
  return { ok: true, src };
}
