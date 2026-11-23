import { createClient } from "@supabase/supabase-js";
import cfg from "../supabase-config.json";

export const sb = createClient(cfg.url, cfg.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Seed images live in the site's /media folder; uploads are full Supabase Storage URLs. */
export const mediaUrl = (ref: string) =>
  !ref ? "" : /^(https?:)?\/\//.test(ref) || ref.startsWith("data:") || ref.startsWith("blob:") ? ref : import.meta.env.BASE_URL + "media/" + ref;

/** Shrinks photos to ≤1600px WebP before upload (SVGs go up untouched), then returns the public URL. */
export async function uploadImage(file: File, folder: string, maxSide = 1600): Promise<string> {
  let body: Blob = file;
  let ext = (file.name.split(".").pop() || "bin").toLowerCase();
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    body = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not read image"))), "image/webp", 0.86));
    ext = "webp";
  }
  const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
  const path = `${folder}/${Date.now().toString(36)}-${base}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, body, { contentType: ext === "webp" ? "image/webp" : file.type, cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[əƏ]/g, "e").replace(/[ıİ]/g, "i").replace(/[öÖ]/g, "o").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
