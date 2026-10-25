import { GoogleGenAI } from "@google/genai";

function pcmToWav(pcmBuffer: Uint8Array, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): ArrayBuffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write string helper
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Copy audio samples
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBuffer, 44);

  return buffer;
}

export async function synthesizeGeminiDirect(
  text: string,
  voiceName: string,
  style: string,
  speed: string,
  apiKey: string
): Promise<{ audioData: string; mimeType: string; voiceUsed: string; durationEstimateSec: number }> {
  const ai = new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: { "User-Agent": "aistudio-build-android" },
    },
  });

  let styleInstruction = "با بیانی کاملاً سلیس، روان، رسا و طبیعی به زبان فارسی";
  if (style === "poetic") {
    styleInstruction = "با بیانی احساسی، موزون، ادیبانه و فاخر به زبان فارسی";
  } else if (style === "story") {
    styleInstruction = "با لحن گرم، جذاب و قصه گویانه و دلنشین به زبان فارسی";
  } else if (style === "formal") {
    styleInstruction = "با لحنی رسمی، شفاف، مقتدر و خبری به زبان فارسی";
  } else if (style === "conversational") {
    styleInstruction = "با لحنی صمیمی، محاوره‌ای، روان و دوستانه به زبان فارسی";
  } else if (style === "energetic") {
    styleInstruction = "با انرژی بالا، شاداب و رسا به زبان فارسی";
  }

  let speedInstruction = "";
  if (speed === "slow") {
    speedInstruction = " و با طمأنینه و سرعت آرام";
  } else if (speed === "fast") {
    speedInstruction = " و با سرعت تند و روان";
  }

  const voicePersonas: Record<string, { gender: "male" | "female"; desc: string }> = {
    Fenrir: {
      gender: "male",
      desc: "با صدای مردانه بم، باصلابت، رسا، باابهت و عمیق (Deep authoritative masculine male voice)",
    },
    Charon: {
      gender: "male",
      desc: "با صدای مردانه پخته، متین، بم، فاخر و رسمی (Mature classical deep male voice)",
    },
    Puck: {
      gender: "male",
      desc: "با صدای مردانه جوان، شاداب، پرانرژی و رسا (Upbeat dynamic male voice)",
    },
    Orus: {
      gender: "male",
      desc: "با صدای مردانه قدرتمند و رسا (Strong masculine male voice)",
    },
    Kore: {
      gender: "female",
      desc: "با صدای زنانه گرم، شفاف، دلنشین و رسا (Warm expressive female voice)",
    },
    Zephyr: {
      gender: "female",
      desc: "با صدای زنانه ملایم، آرامش‌بخش و گوش‌نواز (Gentle soothing female voice)",
    },
    Aoede: {
      gender: "female",
      desc: "با صدای زنانه روشن، دقیق، شیوا و آکادمیک (Bright articulate female voice)",
    },
    Leda: {
      gender: "female",
      desc: "با صدای زنانه مهربان و شیوا (Gentle expressive female voice)",
    },
  };

  const persona = voicePersonas[voiceName] || voicePersonas["Fenrir"];
  const prompt = `Speak the following Persian text with native Persian pronunciation as a ${persona.gender === "male" ? "male voice actor" : "female voice actor"} ${persona.desc}، ${styleInstruction}${speedInstruction}:\n\n${text.trim()}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName || "Fenrir" },
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  const inlineData = part?.inlineData;

  if (!inlineData || !inlineData.data) {
    throw new Error("پاسخ صوتی از مدل هوش مصنوعی دریافت نشد");
  }

  const rawBase64 = inlineData.data;
  const returnedMime = inlineData.mimeType || "audio/pcm;rate=24000";

  let wavBase64 = rawBase64;
  let finalMime = returnedMime;

  if (returnedMime.includes("pcm") || !returnedMime.includes("wav")) {
    const binaryStr = atob(rawBase64);
    const pcmBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      pcmBytes[i] = binaryStr.charCodeAt(i);
    }
    const wavBuffer = pcmToWav(pcmBytes, 24000, 1, 16);
    // Convert ArrayBuffer to base64
    let binary = "";
    const bytes = new Uint8Array(wavBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    wavBase64 = btoa(binary);
    finalMime = "audio/wav";
  }

  return {
    audioData: wavBase64,
    mimeType: finalMime,
    voiceUsed: voiceName,
    durationEstimateSec: Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5)),
  };
}
