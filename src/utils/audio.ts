import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Audio helpers for base64 WAV/MP3 data, mobile-friendly downloading,
 * Capacitor Android filesystem writing, and native Share dialogs.
 */

export interface SaveAudioResult {
  success: boolean;
  message: string;
  filename: string;
  method?: "capacitor" | "web_share" | "browser_download" | "server_stream";
  fileUri?: string;
  error?: string;
}

/**
 * Clean and normalize a base64 audio string
 */
export function cleanBase64(base64Str: string): string {
  if (!base64Str) return "";
  let cleaned = base64Str.trim();
  // Strip data URI scheme if present (e.g., "data:audio/wav;base64,")
  if (cleaned.includes(",")) {
    cleaned = cleaned.split(",")[1];
  }
  // Remove invalid characters like whitespace and newlines
  cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, "");
  // Fix padding if needed
  while (cleaned.length % 4 !== 0) {
    cleaned += "=";
  }
  return cleaned;
}

/**
 * Convert base64 data to a binary Blob
 */
export function base64ToBlob(base64Data: string, mimeType = "audio/wav"): Blob {
  const cleaned = cleanBase64(base64Data);
  try {
    const binaryString = atob(cleaned);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  } catch (err) {
    console.error("Failed to decode base64 audio:", err);
    return new Blob([], { type: mimeType });
  }
}

/**
 * Convert base64 audio data into an Object URL
 */
export function base64ToBlobUrl(base64Data: string, mimeType = "audio/wav"): string {
  if (!base64Data) return "";
  const blob = base64ToBlob(base64Data, mimeType);
  return URL.createObjectURL(blob);
}

/**
 * Check if running inside Capacitor Android/iOS native app
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Check if Web Share API with files is supported
 */
export function canShareAudioFile(): boolean {
  if (isNativeApp()) return true;
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    const testFile = new File(["a"], "test.wav", { type: "audio/wav" });
    return !!(navigator.canShare && navigator.canShare({ files: [testFile] }));
  } catch {
    return false;
  }
}

/**
 * Save audio to device storage across all platforms:
 * 1. Capacitor Native Android: Writes file to Documents/Cache and opens native Share Sheet (Save to Downloads / Files / WhatsApp / Telegram)
 * 2. Mobile Browser: Uses Web Share API (Save to device) or direct HTTP download
 * 3. Desktop Browser: Direct WAV download into the Downloads directory
 */
export async function saveAudioToDevice(
  base64Data: string,
  customFilename?: string,
  preferredMethod: "auto" | "share" | "direct_download" = "auto"
): Promise<SaveAudioResult> {
  if (!base64Data) {
    return {
      success: false,
      message: "داده صوتی برای ذخیره موجود نیست.",
      filename: "",
    };
  }

  const filename =
    customFilename || `persian-tts-${Date.now()}.wav`;
  const cleaned = cleanBase64(base64Data);

  // 1. CAPACITOR NATIVE ANDROID ENVIRONMENT
  if (isNativeApp()) {
    try {
      // First write file to cache or documents
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: cleaned,
        directory: Directory.Cache,
        recursive: true,
      });

      const fileUri = writeResult.uri;

      // Also try writing to Documents so it appears in phone storage
      try {
        await Filesystem.writeFile({
          path: `PersianTTS/${filename}`,
          data: cleaned,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (docErr) {
        console.warn("Could not write to Documents directory, cache is active:", docErr);
      }

      // If user wants to share or by default in native Android, open the system share sheet
      // This gives the user options: "ذخیره در دستگاه / فایل‌ها", "ارسال به تلگرام / واتساپ", etc.
      try {
        await Share.share({
          title: "فایل صوتی فارسی",
          text: "صوت تولید شده با دستیار تبدیل متن به گفتار فارسی",
          url: fileUri,
          dialogTitle: "ذخیره در حافظه یا اشتراک‌گذاری فایل صوتی",
        });

        return {
          success: true,
          method: "capacitor",
          filename,
          fileUri,
          message: `فایل صوتی با نام ${filename} در حافظه گوشی آماده شد و پنجره ذخیره/اشتراک‌گذاری باز شد.`,
        };
      } catch (shareErr) {
        // Even if user cancels the share dialog, the file was already written
        return {
          success: true,
          method: "capacitor",
          filename,
          fileUri,
          message: `فایل صوتی با موفقیت در حافظه گوشی ذخیره گردید.`,
        };
      }
    } catch (err: any) {
      console.error("Capacitor Filesystem write failed:", err);
      // Fall through to browser download fallback
    }
  }

  // 2. MOBILE WEB BROWSER - Native Web Share API
  if (preferredMethod === "share" || (preferredMethod === "auto" && canShareAudioFile() && isMobileBrowser())) {
    try {
      const blob = base64ToBlob(base64Data, "audio/wav");
      const file = new File([blob], filename, { type: "audio/wav" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "فایل صوتی فارسی",
          text: "صوت استودیویی تولید شده با دستیار هوشمند",
          files: [file],
        });
        return {
          success: true,
          method: "web_share",
          filename,
          message: "پنجره ذخیره در گوشی و اشتراک‌گذاری با موفقیت باز شد.",
        };
      }
    } catch (shareErr: any) {
      if (shareErr?.name === "AbortError") {
        return {
          success: true,
          method: "web_share",
          filename,
          message: "عملیات ذخیره لغو شد.",
        };
      }
      console.warn("Web Share API failed, falling back to direct download:", shareErr);
    }
  }

  // 3. BROWSER DOWNLOAD via Blob Link
  try {
    const blob = base64ToBlob(base64Data, "audio/wav");
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 2000);

    return {
      success: true,
      method: "browser_download",
      filename,
      message: `فایل صوتی (${filename}) در پوشه دانلودها (Downloads) دستگاه شما ذخیره شد.`,
    };
  } catch (err: any) {
    console.warn("Direct blob download failed, attempting server stream fallback:", err);
  }

  // 4. SERVER STREAM DOWNLOAD FALLBACK (HTTP Content-Disposition)
  try {
    const response = await fetch("/api/audio/download-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data: cleaned, filename }),
    });

    if (response.ok) {
      const streamBlob = await response.blob();
      const streamUrl = URL.createObjectURL(streamBlob);
      const a = document.createElement("a");
      a.href = streamUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(streamUrl);
      }, 2000);

      return {
        success: true,
        method: "server_stream",
        filename,
        message: `فایل صوتی (${filename}) با موفقیت دانلود و در دستگاه ذخیره شد.`,
      };
    }
  } catch (serverErr) {
    console.error("Server download fallback failed:", serverErr);
  }

  return {
    success: false,
    method: "browser_download",
    filename,
    error: "امکان ذخیره فایل صوتی در این مرورگر مقدور نشد.",
    message: "خطا در ذخیره فایل صوتی. لطفاً مجدداً امتحان کنید.",
  };
}

/**
 * Legacy downloadAudioFile alias for backward compatibility
 */
export async function downloadAudioFile(
  base64Data: string,
  filename = "persian-tts-voice.wav"
): Promise<boolean> {
  const result = await saveAudioToDevice(base64Data, filename, "direct_download");
  return result.success;
}

/**
 * Share audio file via native share sheet
 */
export async function shareAudioFile(
  base64Data: string,
  filename = "persian-tts-voice.wav",
  title = "فایل صوتی فارسی"
): Promise<boolean> {
  const result = await saveAudioToDevice(base64Data, filename, "share");
  return result.success;
}

/**
 * Helper to detect mobile browser
 */
function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Formats time in mm:ss format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
