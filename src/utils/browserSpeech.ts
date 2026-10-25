// Browser Web Speech API helper for Persian Speech Synthesis with gender & pitch calibration
export interface BrowserSpeechOptions {
  voiceId?: string; // e.g. "Fenrir", "Puck", "Charon", "Kore", "Zephyr", "Aoede"
  gender?: "male" | "female";
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface VoiceProfile {
  id: string;
  name: string;
  nameFa: string;
  gender: "male" | "female";
  pitch: number;
  rateMultiplier: number;
}

export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  Fenrir: {
    id: "Fenrir",
    name: "Fenrir",
    nameFa: "فنریر (آقا)",
    gender: "male",
    pitch: 0.65, // deep bass masculine tone
    rateMultiplier: 0.95,
  },
  Charon: {
    id: "Charon",
    name: "Charon",
    nameFa: "کارون (آقا)",
    gender: "male",
    pitch: 0.72, // mature classical male tone
    rateMultiplier: 0.92,
  },
  Puck: {
    id: "Puck",
    name: "Puck",
    nameFa: "پاک (آقا)",
    gender: "male",
    pitch: 0.80, // energetic young male tone
    rateMultiplier: 1.05,
  },
  Kore: {
    id: "Kore",
    name: "Kore",
    nameFa: "کوره (بانو)",
    gender: "female",
    pitch: 1.08, // warm feminine tone
    rateMultiplier: 1.0,
  },
  Zephyr: {
    id: "Zephyr",
    name: "Zephyr",
    nameFa: "زفیر (بانو)",
    gender: "female",
    pitch: 0.98, // gentle feminine tone
    rateMultiplier: 0.90,
  },
  Aoede: {
    id: "Aoede",
    name: "Aoede",
    nameFa: "آئوده (بانو)",
    gender: "female",
    pitch: 1.15, // bright feminine tone
    rateMultiplier: 1.02,
  },
};

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function isBrowserSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getAllBrowserVoices(): SpeechSynthesisVoice[] {
  if (!isBrowserSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function getPersianBrowserVoices(): SpeechSynthesisVoice[] {
  if (!isBrowserSpeechSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  // Filter Persian / Farsi or Google/Microsoft Persian voices
  return voices.filter(
    (v) =>
      v.lang.startsWith("fa") ||
      v.lang.includes("Farsi") ||
      v.name.toLowerCase().includes("persian") ||
      v.name.toLowerCase().includes("farsi")
  );
}

function findBestVoiceForGender(
  gender: "male" | "female",
  persianVoices: SpeechSynthesisVoice[],
  allVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const maleKeywords = ["male", "man", "david", "farid", "reza", "ali", "amir", "daniel", "george", "guy", "ryan", "eric", "mark"];
  const femaleKeywords = ["female", "woman", "girl", "dilara", "zari", "shirin", "sara", "mary", "jenny", "zira", "ayda"];

  if (persianVoices.length > 0) {
    if (gender === "male") {
      const maleFa = persianVoices.find((v) =>
        maleKeywords.some((k) => v.name.toLowerCase().includes(k))
      );
      if (maleFa) return maleFa;
      // If no explicit male Persian voice, return first Persian voice (pitch adjustment will enforce masculine timbre)
      return persianVoices[0];
    } else {
      const femaleFa = persianVoices.find((v) =>
        femaleKeywords.some((k) => v.name.toLowerCase().includes(k))
      );
      if (femaleFa) return femaleFa;
      return persianVoices[0];
    }
  }

  // If no Persian voices, search all voices for matching gender
  if (gender === "male") {
    return allVoices.find((v) =>
      maleKeywords.some((k) => v.name.toLowerCase().includes(k))
    ) || null;
  } else {
    return allVoices.find((v) =>
      femaleKeywords.some((k) => v.name.toLowerCase().includes(k))
    ) || null;
  }
}

export function speakPersianBrowser(
  text: string,
  options: BrowserSpeechOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowserSpeechSupported()) {
      const err = new Error("موتور گفتار مرورگر (Web Speech API) در این مرورگر پشتیبانی نمی‌شود.");
      options.onError?.(err);
      return reject(err);
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const profile = options.voiceId ? VOICE_PROFILES[options.voiceId] : undefined;
    const targetGender = options.gender || profile?.gender || "male";

    // Pitch tuning: for male voices like Fenrir, use deep bass pitch (0.65)
    let calculatedPitch = options.pitch ?? (profile ? profile.pitch : (targetGender === "male" ? 0.65 : 1.08));
    let calculatedRate = (options.rate ?? 1.0) * (profile?.rateMultiplier ?? 1.0);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fa-IR";
    utterance.rate = calculatedRate;
    utterance.pitch = calculatedPitch;
    utterance.volume = options.volume ?? 1.0;

    const persianVoices = getPersianBrowserVoices();
    const allVoices = getAllBrowserVoices();
    const chosenVoice = findBestVoiceForGender(targetGender, persianVoices, allVoices);

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
      options.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      options.onEnd?.();
      resolve();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      options.onError?.(e);
      reject(e);
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function stopBrowserSpeech(): void {
  if (isBrowserSpeechSupported()) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}
