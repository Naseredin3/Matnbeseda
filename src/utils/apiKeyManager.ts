const STORAGE_KEY = "PERMANENT_GEMINI_API_KEY";

export function getPermanentApiKey(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function setPermanentApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed to save permanent API key:", err);
  }
}

export function removePermanentApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to remove permanent API key:", err);
  }
}

export function hasPermanentApiKey(): boolean {
  return !!getPermanentApiKey();
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

export async function verifyApiKeyRemote(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("/api/verify-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey }),
    });

    const data = await res.json();
    if (!res.ok || !data.valid) {
      return { valid: false, error: data.error || "کلید نامعتبر است" };
    }
    return { valid: true };
  } catch (err: any) {
    // If backend is unreachable (e.g. offline Android APK), test direct fetch to Gemini endpoint
    try {
      const directRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (directRes.ok) {
        return { valid: true };
      }
      const directData = await directRes.json();
      return {
        valid: false,
        error: directData.error?.message || "کلید توسط سرور گوگل تایید نشد.",
      };
    } catch {
      return { valid: false, error: "امکان بررسی اعتبار به دلیل قطعی اینترنت وجود ندارد." };
    }
  }
}
