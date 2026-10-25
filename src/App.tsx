import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { TextInputArea } from "./components/TextInputArea";
import { VoiceSelector } from "./components/VoiceSelector";
import { AudioPlayerSection } from "./components/AudioPlayerSection";
import { SpeechHistory } from "./components/SpeechHistory";
import { TipsCard } from "./components/TipsCard";
import { AudioHistoryItem } from "./types";
import { AlertCircle, X, Play, Square, KeyRound } from "lucide-react";
import { speakPersianBrowser, stopBrowserSpeech } from "./utils/browserSpeech";

const INITIAL_PERSIAN_TEXT =
  "سلام و درود! به سامانه تبدیل هوشمند متن به گفتار فارسی سلیس و روان خوش آمدید. هر متنی را اینجا بنویسید تا با لحنی رسا، طبیعی و کیفیت استودیویی خوانده شود.";

export default function App() {
  const [text, setText] = useState<string>(INITIAL_PERSIAN_TEXT);
  const [selectedVoice, setSelectedVoice] = useState<string>("Fenrir");
  const [selectedStyle, setSelectedStyle] = useState<
    "natural" | "poetic" | "story" | "formal" | "conversational" | "energetic"
  >("natural");
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">("normal");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState<boolean>(false);
  const [isBrowserSpeakingFallback, setIsBrowserSpeakingFallback] = useState<boolean>(false);

  // Active audio playing state
  const [activeAudioData, setActiveAudioData] = useState<string | null>(null);
  const [activeSpokenText, setActiveSpokenText] = useState<string>("");
  const [activeVoiceUsed, setActiveVoiceUsed] = useState<string>("Fenrir");
  const [activeStyleUsed, setActiveStyleUsed] = useState<string>("natural");

  // Local storage history
  const [history, setHistory] = useState<AudioHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("persian_tts_history");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("persian_tts_history", JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const handleFallbackBrowserSpeech = async () => {
    if (!text.trim()) return;
    if (isBrowserSpeakingFallback) {
      stopBrowserSpeech();
      setIsBrowserSpeakingFallback(false);
      return;
    }
    const rateMap = { slow: 0.8, normal: 1.0, fast: 1.25 };
    try {
      await speakPersianBrowser(text.trim(), {
        voiceId: selectedVoice,
        rate: rateMap[speed] || 1.0,
        onStart: () => setIsBrowserSpeakingFallback(true),
        onEnd: () => setIsBrowserSpeakingFallback(false),
        onError: () => setIsBrowserSpeakingFallback(false),
      });
    } catch {
      setIsBrowserSpeakingFallback(false);
    }
  };

  const handleGenerateTTS = async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsAuthError(false);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice,
          style: selectedStyle,
          speed: speed,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        if (data.isAuthError || response.status === 401 || response.status === 403) {
          setIsAuthError(true);
        }
        throw new Error(data.error || "خطا در برقراری ارتباط با سرور TTS");
      }

      if (!data.audioData) {
        throw new Error("داده صوتی دریافت نشد");
      }

      const generatedAudio = data.audioData;
      const voice = data.voiceUsed || selectedVoice;

      setActiveAudioData(generatedAudio);
      setActiveSpokenText(text.trim());
      setActiveVoiceUsed(voice);
      setActiveStyleUsed(selectedStyle);

      // Add to history
      const newItem: AudioHistoryItem = {
        id: Date.now().toString(),
        text: text.trim(),
        voiceName: voice,
        style: selectedStyle,
        speed: speed,
        audioData: generatedAudio,
        mimeType: data.mimeType || "audio/wav",
        createdAt: new Date().toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: data.durationEstimateSec,
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
    } catch (err: any) {
      console.error("TTS generation error:", err);
      setErrorMessage(
        err.message || "متأسفانه در تولید صوت خطایی رخ داد. لطفاً مجدداً تلاش نمایید."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (
    presetText: string,
    suggestedVoice?: string,
    suggestedStyle?: any
  ) => {
    setText(presetText);
    if (suggestedVoice) setSelectedVoice(suggestedVoice);
    if (suggestedStyle) setSelectedStyle(suggestedStyle);
  };

  const handleSelectHistoryItem = (item: AudioHistoryItem) => {
    setActiveAudioData(item.audioData);
    setActiveSpokenText(item.text);
    setActiveVoiceUsed(item.voiceName);
    setActiveStyleUsed(item.style);
    setText(item.text);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white" dir="rtl">
      <Header isLoading={isLoading} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/40 border border-rose-600/40 text-rose-200 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <span className="font-semibold text-rose-100 block mb-0.5">
                    {isAuthError ? "نیاز به بررسی کلید دسترسی هوش مصنوعی (API Key):" : "پیام سیستم هوش مصنوعی:"}
                  </span>
                  <span>{errorMessage}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 rounded-md hover:bg-rose-900/50 text-rose-300 self-end sm:self-center"
                aria-label="بستن پیام خطا"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick action bar */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleFallbackBrowserSpeech}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isBrowserSpeakingFallback
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                }`}
              >
                {isBrowserSpeakingFallback ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>توقف خوانش متن با مرورگر</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>شنیدن فوری این متن با موتور صوتی مرورگر</span>
                  </>
                )}
              </button>

              {isAuthError && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300/90">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>تنظیم کلید معتبر: منوی بالای صفحه &gt; Settings &gt; Secrets</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Section: Text Area & Voice Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Input Text Area (7 cols on large) */}
          <div className="lg:col-span-7 space-y-6">
            <TextInputArea
              text={text}
              setText={setText}
              onGenerate={handleGenerateTTS}
              isLoading={isLoading}
              onSelectPreset={handleSelectPreset}
              speed={speed}
              selectedVoice={selectedVoice}
            />

            {/* Audio Player Component */}
            <AudioPlayerSection
              audioData={activeAudioData}
              spokenText={activeSpokenText}
              voiceName={activeVoiceUsed}
              style={activeStyleUsed}
            />
          </div>

          {/* Voice Personas & Style Settings (5 cols on large) */}
          <div className="lg:col-span-5 space-y-6">
            <VoiceSelector
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              speed={speed}
              setSpeed={setSpeed}
            />

            {/* Speech History */}
            <SpeechHistory
              history={history}
              onSelectHistory={handleSelectHistoryItem}
              onClearHistory={handleClearHistory}
              onDeleteOne={handleDeleteHistoryItem}
            />
          </div>
        </div>

        {/* Bottom Persian Pronunciation Tips */}
        <TipsCard />
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-center text-xs text-slate-500">
        <p>توسعه‌یافته با موتور صوتی Gemini 3.1 Flash TTS برای خوانش طبیعی و سلیس زبان فارسی</p>
      </footer>
    </div>
  );
}
