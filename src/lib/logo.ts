import { LOGO_MIME_TYPES, MAX_LOGO_BYTES } from "@/lib/validators";

export type ParsedLogo = {
  mime: string;
  bytes: Uint8Array<ArrayBuffer>;
};

export async function parseClubLogo(
  file: FormDataEntryValue | null,
): Promise<{ ok: true; logo: ParsedLogo | null } | { ok: false; message: string }> {
  if (!file || typeof file === "string") {
    return { ok: true, logo: null };
  }
  if (file.size === 0) {
    return { ok: true, logo: null };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: "Logo tối đa 500KB" };
  }
  const mime = file.type;
  if (!(LOGO_MIME_TYPES as readonly string[]).includes(mime)) {
    return { ok: false, message: "Logo phải là JPEG, PNG hoặc WebP" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
  return { ok: true, logo: { mime, bytes } };
}
