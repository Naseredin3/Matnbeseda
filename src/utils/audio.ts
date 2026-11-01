/**
 * Audio helpers for base64 WAV/MP3 data, mobile-friendly downloading,
 * Web Share API, and IndexedDB audio persistence.
 */

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
    // Return empty blob on error
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
 * Check if Web Share API with files is supported (works great on Android/iOS)
 */
export function canShareAudioFile(): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    const testFile = new File(["a"], "test.wav", { type: "audio/wav" });
    return !!(navigator.canShare && navigator.canShare({ files: [testFile] }));
  } catch {
    return false;
  }
}

/**
 * Share audio file using native Android / iOS share dialog
 * This allows saving directly to "Files / Downloads", WhatsApp, Telegram, etc.
 */
export async function shareAudioFile(
  base64Data: string,
  filename = "persian-tts-voice.wav",
  title = "فایل صوتی فارسی"
): Promise<boolean> {
  try {
    const blob = base64ToBlob(base64Data, "audio/wav");
    const file = new File([blob], filename, { type: "audio/wav" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title,
        text: "صوت تولید شده با دستیار تبدیل متن به گفتار فارسی",
        files: [file],
      });
      return true;
    }
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.warn("Native share failed, falling back to download:", err);
    }
  }
  return false;
}

/**
 * Universal download function that works on Desktop, Mobile browsers, and WebViews
 */
export async function downloadAudioFile(
  base64Data: string,
  filename = "persian-tts-voice.wav"
): Promise<boolean> {
  if (!base64Data) return false;

  try {
    const blob = base64ToBlob(base64Data, "audio/wav");
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);

    // Trigger click
    a.click();

    // Cleanup after short delay
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore cleanup error
      }
    }, 2000);

    return true;
  } catch (e) {
    console.error("Direct download failed, trying data URI fallback:", e);

    // Data URI fallback
    try {
      const cleaned = cleanBase64(base64Data);
      const dataUri = `data:audio/wav;base64,${cleaned}`;
      const a = document.createElement("a");
      a.href = dataUri;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
      return true;
    } catch (err) {
      console.error("Fallback download failed:", err);
      return false;
    }
  }
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
