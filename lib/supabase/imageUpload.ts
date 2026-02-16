import { supabase } from "@/lib/supabase/client";

interface UploadImageOptions {
  file: File;
  folder: string;
  bucket?: string;
}

const getFileExtension = (file: File): string => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  return file.type.split("/")[1] || "jpg";
};

export const uploadImageToStorage = async ({ file, folder, bucket = "avatars" }: UploadImageOptions): Promise<string> => {
  const extension = getFileExtension(file);
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "");
  const filePath = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error("Yüklenen görsel için URL alınamadı.");
  }

  return publicUrl;
};
