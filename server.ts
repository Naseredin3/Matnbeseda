import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("کلید دسترسی Gemini API تنظیم نشده است. لطفاً کلید دائمی خود را در بخش تنظیمات وارد نمایید یا در متغیر محیطی GEMINI_API_KEY قرار دهید.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // RIFF chunk length
  header.writeUInt32LE(36 + dataSize, 4);
  // RIFF type
  header.write("WAVE", 8);
  // format chunk identifier
  header.write("fmt ", 12);
  // format chunk length
  header.writeUInt32LE(16, 16);
  // sample format (1 = PCM)
  header.writeUInt16LE(1, 20);
  // channel count
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate
  header.writeUInt32LE(byteRate, 28);
  // block align
  header.writeUInt16LE(blockAlign, 32);
  // bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  header.write("data", 36);
  // data chunk length
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function parseGeminiError(err: any): { status: number; message: string; isAuthError: boolean } {
  const errMsg = err?.message || String(err);
  const errStr = JSON.stringify(err || {});
  
  if (
    errMsg.includes("401") ||
    errMsg.includes("UNAUTHENTICATED") ||
    errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
    errMsg.includes("API_KEY_SERVICE_BLOCKED") ||
    errMsg.includes("API_KEY_INVALID") ||
    errStr.includes("UNAUTHENTICATED") ||
    errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
    errStr.includes("API_KEY_SERVICE_BLOCKED") ||
    errStr.includes("API_KEY_INVALID")
  ) {
    return {
      status: 401,
      isAuthError: true,
      message: "کلید دسترسی Gemini API نامعتبر است یا منقضی شده است. لطفاً از منوی تنظیمات (Settings > Secrets) کلید معتبر خود را انتخاب کنید.",
    };
  }

  if (
    errMsg.includes("403") ||
    errMsg.includes("PERMISSION_DENIED") ||
    errStr.includes("PERMISSION_DENIED")
  ) {
    return {
      status: 403,
      isAuthError: true,
      message: "دسترسی به مدل مجاز نیست. لطفاً کلید API خود را در بخش Settings > Secrets بررسی کنید.",
    };
  }

  if (
    errMsg.includes("429") ||
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errStr.includes("RESOURCE_EXHAUSTED")
  ) {
    return {
      status: 429,
      isAuthError: false,
      message: "سقف درخواست‌های مجاز (Quota) به پایان رسیده است. لطفاً کمی بعد تلاش کنید یا از کلید حساب ویژه استفاده نمایید.",
    };
  }

  return {
    status: 500,
    isAuthError: false,
    message: errMsg || "خطا در برقراری ارتباط با سرور هوش مصنوعی",
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    const customKey = (req.headers["x-gemini-key"] as string) || (req.query.key as string);
    const hasCustomKey = !!(customKey && customKey.trim());
    const hasEnvKey = !!process.env.GEMINI_API_KEY?.trim();

    res.json({
      status: "ok",
      hasKey: hasCustomKey || hasEnvKey,
      isCustomKeyProvided: hasCustomKey,
      hasEnvKey: hasEnvKey,
      timestamp: new Date().toISOString(),
    });
  });

  // Verify API Key validity endpoint
  app.post("/api/verify-key", async (req, res) => {
    try {
      const apiKey = (req.body?.apiKey || req.headers["x-gemini-key"] || process.env.GEMINI_API_KEY) as string;
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ valid: false, error: "کلید API وارد نشده است." });
      }

      const client = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: { headers: { "User-Agent": "aistudio-build-verify" } },
      });

      // Quick test call with a light prompt
      await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: "ping" }] }],
      });

      return res.json({ valid: true, message: "کلید دائمی معتبر است و با موفقیت تایید شد." });
    } catch (err: any) {
      console.warn("Key verification failed:", err?.message);
      const parsed = parseGeminiError(err);
      return res.status(parsed.status).json({
        valid: false,
        error: parsed.message,
        isAuthError: parsed.isAuthError,
      });
    }
  });

  // Text-To-Speech endpoint using gemini-3.1-flash-tts-preview
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceName = "Kore", style = "natural", speed = "normal", apiKey: bodyKey } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "متن وارد شده خالی است" });
      }

      const clientKey = (req.headers["x-gemini-key"] as string) || bodyKey;
      const ai = getGeminiClient(clientKey);

      // Formulate Persian speech guidance
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

      const validVoices = ["Fenrir", "Puck", "Charon", "Orus", "Kore", "Zephyr", "Aoede", "Leda"];
      const selectedVoice = validVoices.includes(voiceName) ? voiceName : "Fenrir";

      // Precise voice persona directives for male/female voices
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

      const persona = voicePersonas[selectedVoice] || voicePersonas["Fenrir"];
      const prompt = `Speak the following Persian text with native Persian pronunciation as a ${persona.gender === "male" ? "male voice actor" : "female voice actor"} ${persona.desc}، ${styleInstruction}${speedInstruction}:\n\n${text.trim()}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const inlineData = part?.inlineData;

      if (!inlineData || !inlineData.data) {
        return res.status(500).json({ error: "پاسخ صوتی از مدل دریافت نشد" });
      }

      const rawBase64 = inlineData.data;
      const returnedMime = inlineData.mimeType || "audio/pcm;rate=24000";

      let wavBase64 = rawBase64;
      let finalMime = returnedMime;

      // If audio is raw PCM or rate=24000, build standard WAV
      if (returnedMime.includes("pcm") || !returnedMime.includes("wav")) {
        const rawBuffer = Buffer.from(rawBase64, "base64");
        const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
        wavBase64 = wavBuffer.toString("base64");
        finalMime = "audio/wav";
      }

      return res.json({
        audioData: wavBase64,
        rawPcmData: rawBase64,
        mimeType: finalMime,
        durationEstimateSec: Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5)),
        voiceUsed: selectedVoice,
      });
    } catch (err: any) {
      console.error("TTS generation error:", err);
      const parsed = parseGeminiError(err);
      return res.status(parsed.status).json({
        error: parsed.message,
        isAuthError: parsed.isAuthError,
      });
    }
  });

  // Persian Text Enhancement Helper (Diacritics & Fluency Polish) using gemini-3.7-flash
  app.post("/api/persian/polish", async (req, res) => {
    try {
      const { text, mode = "fluency", apiKey: bodyKey } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "متن خالی است" });
      }

      const clientKey = (req.headers["x-gemini-key"] as string) || bodyKey;
      const ai = getGeminiClient(clientKey);

      let systemPrompt = "";
      if (mode === "diacritics") {
        systemPrompt = "متن فارسی داده شده را با اعراب‌گذاری و حرکت‌گذاری صحیح (فتحه، کسره، ضمه، تشدید، تنوین و سکون) کامل کن تا موتور تبدیل متن به صوت بتواند کلمات را دقیقاً درست و بدون ابهام تلفظ کند. فقط متن اعراب‌گذاری شده را برگردان بدون هیچ توضیح اضافه.";
      } else if (mode === "colloquial") {
        systemPrompt = "متن فارسی داده شده را به زبان محاوره‌ای و عامیانه بسیار روان، سلیس و دلنشین تبدیل کن که برای خوانش صوتی و گفتار روزمره عالی باشد. فقط متن بازنویسی شده را برگردان.";
      } else if (mode === "formal") {
        systemPrompt = "متن فارسی داده شده را به نثری شیوا، استاندارد، ادبی و کاملاً سلیس و ساختاریافته تبدیل کن. فقط متن اصلاح شده را برگردان.";
      } else {
        systemPrompt = "متن فارسی داده شده را از نظر روانی، سلیس بودن، علائم نگارشی و تلفظ بهینه‌سازی کن تا هنگام خوانده شدن توسط گوینده صوتی کاملاً واضح، طبیعی و گوش‌نواز باشد. فقط متن بهینه‌سازی شده را برگردان.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: text.trim(),
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
        },
      });

      return res.json({
        polishedText: response.text?.trim() || text,
      });
    } catch (err: any) {
      console.error("Persian polish error:", err);
      const parsed = parseGeminiError(err);
      return res.status(parsed.status).json({
        error: parsed.message,
        isAuthError: parsed.isAuthError,
      });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTS Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
