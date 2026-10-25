var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function pcmToWav(pcmBuffer, sampleRate = 24e3, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}
function parseGeminiError(err) {
  const errMsg = err?.message || String(err);
  const errStr = JSON.stringify(err || {});
  if (errMsg.includes("401") || errMsg.includes("UNAUTHENTICATED") || errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errMsg.includes("API_KEY_SERVICE_BLOCKED") || errMsg.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errStr.includes("API_KEY_SERVICE_BLOCKED") || errStr.includes("API_KEY_INVALID")) {
    return {
      status: 401,
      isAuthError: true,
      message: "\u06A9\u0644\u06CC\u062F \u062F\u0633\u062A\u0631\u0633\u06CC Gemini API \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0627\u0632 \u0645\u0646\u0648\u06CC \u062A\u0646\u0638\u06CC\u0645\u0627\u062A (Settings > Secrets) \u06A9\u0644\u06CC\u062F \u0645\u0639\u062A\u0628\u0631 \u062E\u0648\u062F \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F."
    };
  }
  if (errMsg.includes("403") || errMsg.includes("PERMISSION_DENIED") || errStr.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      isAuthError: true,
      message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u0628\u0647 \u0645\u062F\u0644 \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06A9\u0644\u06CC\u062F API \u062E\u0648\u062F \u0631\u0627 \u062F\u0631 \u0628\u062E\u0634 Settings > Secrets \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F."
    };
  }
  if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errStr.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      isAuthError: false,
      message: "\u0633\u0642\u0641 \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0645\u062C\u0627\u0632 (Quota) \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06A9\u0645\u06CC \u0628\u0639\u062F \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F \u06CC\u0627 \u0627\u0632 \u06A9\u0644\u06CC\u062F \u062D\u0633\u0627\u0628 \u0648\u06CC\u0698\u0647 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0646\u0645\u0627\u06CC\u06CC\u062F."
    };
  }
  return {
    status: 500,
    isAuthError: false,
    message: errMsg || "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0642\u0631\u0627\u0631\u06CC \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u0631 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC"
  };
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "15mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasKey: !!process.env.GEMINI_API_KEY,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceName = "Kore", style = "natural", speed = "normal" } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "\u0645\u062A\u0646 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A" });
      }
      const ai = getGeminiClient();
      let styleInstruction = "\u0628\u0627 \u0628\u06CC\u0627\u0646\u06CC \u06A9\u0627\u0645\u0644\u0627\u064B \u0633\u0644\u06CC\u0633\u060C \u0631\u0648\u0627\u0646\u060C \u0631\u0633\u0627 \u0648 \u0637\u0628\u06CC\u0639\u06CC \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC";
      if (style === "poetic") {
        styleInstruction = "\u0628\u0627 \u0628\u06CC\u0627\u0646\u06CC \u0627\u062D\u0633\u0627\u0633\u06CC\u060C \u0645\u0648\u0632\u0648\u0646\u060C \u0627\u062F\u06CC\u0628\u0627\u0646\u0647 \u0648 \u0641\u0627\u062E\u0631 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC";
      } else if (style === "story") {
        styleInstruction = "\u0628\u0627 \u0644\u062D\u0646 \u06AF\u0631\u0645\u060C \u062C\u0630\u0627\u0628 \u0648 \u0642\u0635\u0647 \u06AF\u0648\u06CC\u0627\u0646\u0647 \u0648 \u062F\u0644\u0646\u0634\u06CC\u0646 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC";
      } else if (style === "formal") {
        styleInstruction = "\u0628\u0627 \u0644\u062D\u0646\u06CC \u0631\u0633\u0645\u06CC\u060C \u0634\u0641\u0627\u0641\u060C \u0645\u0642\u062A\u062F\u0631 \u0648 \u062E\u0628\u0631\u06CC \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC";
      } else if (style === "conversational") {
        styleInstruction = "\u0628\u0627 \u0644\u062D\u0646\u06CC \u0635\u0645\u06CC\u0645\u06CC\u060C \u0645\u062D\u0627\u0648\u0631\u0647\u200C\u0627\u06CC\u060C \u0631\u0648\u0627\u0646 \u0648 \u062F\u0648\u0633\u062A\u0627\u0646\u0647 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC";
      } else if (style === "energetic") {
        styleInstruction = "\u0628\u0627 \u0627\u0646\u0631\u0698\u06CC \u0628\u0627\u0644\u0627\u060C \u0634\u0627\u062F\u0627\u0628 \u0648 \u0631\u0633\u0627 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC";
      }
      let speedInstruction = "";
      if (speed === "slow") {
        speedInstruction = " \u0648 \u0628\u0627 \u0637\u0645\u0623\u0646\u06CC\u0646\u0647 \u0648 \u0633\u0631\u0639\u062A \u0622\u0631\u0627\u0645";
      } else if (speed === "fast") {
        speedInstruction = " \u0648 \u0628\u0627 \u0633\u0631\u0639\u062A \u062A\u0646\u062F \u0648 \u0631\u0648\u0627\u0646";
      }
      const validVoices = ["Fenrir", "Puck", "Charon", "Orus", "Kore", "Zephyr", "Aoede", "Leda"];
      const selectedVoice = validVoices.includes(voiceName) ? voiceName : "Fenrir";
      const voicePersonas = {
        Fenrir: {
          gender: "male",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0645\u0631\u062F\u0627\u0646\u0647 \u0628\u0645\u060C \u0628\u0627\u0635\u0644\u0627\u0628\u062A\u060C \u0631\u0633\u0627\u060C \u0628\u0627\u0627\u0628\u0647\u062A \u0648 \u0639\u0645\u06CC\u0642 (Deep authoritative masculine male voice)"
        },
        Charon: {
          gender: "male",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0645\u0631\u062F\u0627\u0646\u0647 \u067E\u062E\u062A\u0647\u060C \u0645\u062A\u06CC\u0646\u060C \u0628\u0645\u060C \u0641\u0627\u062E\u0631 \u0648 \u0631\u0633\u0645\u06CC (Mature classical deep male voice)"
        },
        Puck: {
          gender: "male",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0645\u0631\u062F\u0627\u0646\u0647 \u062C\u0648\u0627\u0646\u060C \u0634\u0627\u062F\u0627\u0628\u060C \u067E\u0631\u0627\u0646\u0631\u0698\u06CC \u0648 \u0631\u0633\u0627 (Upbeat dynamic male voice)"
        },
        Orus: {
          gender: "male",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0645\u0631\u062F\u0627\u0646\u0647 \u0642\u062F\u0631\u062A\u0645\u0646\u062F \u0648 \u0631\u0633\u0627 (Strong masculine male voice)"
        },
        Kore: {
          gender: "female",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0632\u0646\u0627\u0646\u0647 \u06AF\u0631\u0645\u060C \u0634\u0641\u0627\u0641\u060C \u062F\u0644\u0646\u0634\u06CC\u0646 \u0648 \u0631\u0633\u0627 (Warm expressive female voice)"
        },
        Zephyr: {
          gender: "female",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0632\u0646\u0627\u0646\u0647 \u0645\u0644\u0627\u06CC\u0645\u060C \u0622\u0631\u0627\u0645\u0634\u200C\u0628\u062E\u0634 \u0648 \u06AF\u0648\u0634\u200C\u0646\u0648\u0627\u0632 (Gentle soothing female voice)"
        },
        Aoede: {
          gender: "female",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0632\u0646\u0627\u0646\u0647 \u0631\u0648\u0634\u0646\u060C \u062F\u0642\u06CC\u0642\u060C \u0634\u06CC\u0648\u0627 \u0648 \u0622\u06A9\u0627\u062F\u0645\u06CC\u06A9 (Bright articulate female voice)"
        },
        Leda: {
          gender: "female",
          desc: "\u0628\u0627 \u0635\u062F\u0627\u06CC \u0632\u0646\u0627\u0646\u0647 \u0645\u0647\u0631\u0628\u0627\u0646 \u0648 \u0634\u06CC\u0648\u0627 (Gentle expressive female voice)"
        }
      };
      const persona = voicePersonas[selectedVoice] || voicePersonas["Fenrir"];
      const prompt = `Speak the following Persian text with native Persian pronunciation as a ${persona.gender === "male" ? "male voice actor" : "female voice actor"} ${persona.desc}\u060C ${styleInstruction}${speedInstruction}:

${text.trim()}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice }
            }
          }
        }
      });
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const inlineData = part?.inlineData;
      if (!inlineData || !inlineData.data) {
        return res.status(500).json({ error: "\u067E\u0627\u0633\u062E \u0635\u0648\u062A\u06CC \u0627\u0632 \u0645\u062F\u0644 \u062F\u0631\u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
      }
      const rawBase64 = inlineData.data;
      const returnedMime = inlineData.mimeType || "audio/pcm;rate=24000";
      let wavBase64 = rawBase64;
      let finalMime = returnedMime;
      if (returnedMime.includes("pcm") || !returnedMime.includes("wav")) {
        const rawBuffer = Buffer.from(rawBase64, "base64");
        const wavBuffer = pcmToWav(rawBuffer, 24e3, 1, 16);
        wavBase64 = wavBuffer.toString("base64");
        finalMime = "audio/wav";
      }
      return res.json({
        audioData: wavBase64,
        rawPcmData: rawBase64,
        mimeType: finalMime,
        durationEstimateSec: Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5)),
        voiceUsed: selectedVoice
      });
    } catch (err) {
      console.error("TTS generation error:", err);
      const parsed = parseGeminiError(err);
      return res.status(parsed.status).json({
        error: parsed.message,
        isAuthError: parsed.isAuthError
      });
    }
  });
  app.post("/api/persian/polish", async (req, res) => {
    try {
      const { text, mode = "fluency" } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "\u0645\u062A\u0646 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A" });
      }
      const ai = getGeminiClient();
      let systemPrompt = "";
      if (mode === "diacritics") {
        systemPrompt = "\u0645\u062A\u0646 \u0641\u0627\u0631\u0633\u06CC \u062F\u0627\u062F\u0647 \u0634\u062F\u0647 \u0631\u0627 \u0628\u0627 \u0627\u0639\u0631\u0627\u0628\u200C\u06AF\u0630\u0627\u0631\u06CC \u0648 \u062D\u0631\u06A9\u062A\u200C\u06AF\u0630\u0627\u0631\u06CC \u0635\u062D\u06CC\u062D (\u0641\u062A\u062D\u0647\u060C \u06A9\u0633\u0631\u0647\u060C \u0636\u0645\u0647\u060C \u062A\u0634\u062F\u06CC\u062F\u060C \u062A\u0646\u0648\u06CC\u0646 \u0648 \u0633\u06A9\u0648\u0646) \u06A9\u0627\u0645\u0644 \u06A9\u0646 \u062A\u0627 \u0645\u0648\u062A\u0648\u0631 \u062A\u0628\u062F\u06CC\u0644 \u0645\u062A\u0646 \u0628\u0647 \u0635\u0648\u062A \u0628\u062A\u0648\u0627\u0646\u062F \u06A9\u0644\u0645\u0627\u062A \u0631\u0627 \u062F\u0642\u06CC\u0642\u0627\u064B \u062F\u0631\u0633\u062A \u0648 \u0628\u062F\u0648\u0646 \u0627\u0628\u0647\u0627\u0645 \u062A\u0644\u0641\u0638 \u06A9\u0646\u062F. \u0641\u0642\u0637 \u0645\u062A\u0646 \u0627\u0639\u0631\u0627\u0628\u200C\u06AF\u0630\u0627\u0631\u06CC \u0634\u062F\u0647 \u0631\u0627 \u0628\u0631\u06AF\u0631\u062F\u0627\u0646 \u0628\u062F\u0648\u0646 \u0647\u06CC\u0686 \u062A\u0648\u0636\u06CC\u062D \u0627\u0636\u0627\u0641\u0647.";
      } else if (mode === "colloquial") {
        systemPrompt = "\u0645\u062A\u0646 \u0641\u0627\u0631\u0633\u06CC \u062F\u0627\u062F\u0647 \u0634\u062F\u0647 \u0631\u0627 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0645\u062D\u0627\u0648\u0631\u0647\u200C\u0627\u06CC \u0648 \u0639\u0627\u0645\u06CC\u0627\u0646\u0647 \u0628\u0633\u06CC\u0627\u0631 \u0631\u0648\u0627\u0646\u060C \u0633\u0644\u06CC\u0633 \u0648 \u062F\u0644\u0646\u0634\u06CC\u0646 \u062A\u0628\u062F\u06CC\u0644 \u06A9\u0646 \u06A9\u0647 \u0628\u0631\u0627\u06CC \u062E\u0648\u0627\u0646\u0634 \u0635\u0648\u062A\u06CC \u0648 \u06AF\u0641\u062A\u0627\u0631 \u0631\u0648\u0632\u0645\u0631\u0647 \u0639\u0627\u0644\u06CC \u0628\u0627\u0634\u062F. \u0641\u0642\u0637 \u0645\u062A\u0646 \u0628\u0627\u0632\u0646\u0648\u06CC\u0633\u06CC \u0634\u062F\u0647 \u0631\u0627 \u0628\u0631\u06AF\u0631\u062F\u0627\u0646.";
      } else if (mode === "formal") {
        systemPrompt = "\u0645\u062A\u0646 \u0641\u0627\u0631\u0633\u06CC \u062F\u0627\u062F\u0647 \u0634\u062F\u0647 \u0631\u0627 \u0628\u0647 \u0646\u062B\u0631\u06CC \u0634\u06CC\u0648\u0627\u060C \u0627\u0633\u062A\u0627\u0646\u062F\u0627\u0631\u062F\u060C \u0627\u062F\u0628\u06CC \u0648 \u06A9\u0627\u0645\u0644\u0627\u064B \u0633\u0644\u06CC\u0633 \u0648 \u0633\u0627\u062E\u062A\u0627\u0631\u06CC\u0627\u0641\u062A\u0647 \u062A\u0628\u062F\u06CC\u0644 \u06A9\u0646. \u0641\u0642\u0637 \u0645\u062A\u0646 \u0627\u0635\u0644\u0627\u062D \u0634\u062F\u0647 \u0631\u0627 \u0628\u0631\u06AF\u0631\u062F\u0627\u0646.";
      } else {
        systemPrompt = "\u0645\u062A\u0646 \u0641\u0627\u0631\u0633\u06CC \u062F\u0627\u062F\u0647 \u0634\u062F\u0647 \u0631\u0627 \u0627\u0632 \u0646\u0638\u0631 \u0631\u0648\u0627\u0646\u06CC\u060C \u0633\u0644\u06CC\u0633 \u0628\u0648\u062F\u0646\u060C \u0639\u0644\u0627\u0626\u0645 \u0646\u06AF\u0627\u0631\u0634\u06CC \u0648 \u062A\u0644\u0641\u0638 \u0628\u0647\u06CC\u0646\u0647\u200C\u0633\u0627\u0632\u06CC \u06A9\u0646 \u062A\u0627 \u0647\u0646\u06AF\u0627\u0645 \u062E\u0648\u0627\u0646\u062F\u0647 \u0634\u062F\u0646 \u062A\u0648\u0633\u0637 \u06AF\u0648\u06CC\u0646\u062F\u0647 \u0635\u0648\u062A\u06CC \u06A9\u0627\u0645\u0644\u0627\u064B \u0648\u0627\u0636\u062D\u060C \u0637\u0628\u06CC\u0639\u06CC \u0648 \u06AF\u0648\u0634\u200C\u0646\u0648\u0627\u0632 \u0628\u0627\u0634\u062F. \u0641\u0642\u0637 \u0645\u062A\u0646 \u0628\u0647\u06CC\u0646\u0647\u200C\u0633\u0627\u0632\u06CC \u0634\u062F\u0647 \u0631\u0627 \u0628\u0631\u06AF\u0631\u062F\u0627\u0646.";
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: text.trim(),
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3
        }
      });
      return res.json({
        polishedText: response.text?.trim() || text
      });
    } catch (err) {
      console.error("Persian polish error:", err);
      const parsed = parseGeminiError(err);
      return res.status(parsed.status).json({
        error: parsed.message,
        isAuthError: parsed.isAuthError
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
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
//# sourceMappingURL=server.cjs.map
