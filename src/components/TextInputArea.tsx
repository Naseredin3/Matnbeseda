import React, { useState } from "react";
import {
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  ClipboardPaste,
  BookOpen,
  Wand2,
  Volume2,
  Clock,
  FileText,
  Loader2,
  ChevronDown,
  Play,
  Square,
} from "lucide-react";
import { PRESET_CATEGORIES, VOICES } from "../data/presets";
import {
  speakPersianBrowser,
  stopBrowserSpeech,
  isBrowserSpeechSupported,
} from "../utils/browserSpeech";

interface TextInputAreaProps {
  text: string;
  setText: (val: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onSelectPreset: (text: string, voice?: string, style?: any) => void;
  speed?: "slow" | "normal" | "fast";
  selectedVoice?: string;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  setText,
  onGenerate,
  isLoading,
  onSelectPreset,
  speed = "normal",
  selectedVoice = "Fenrir",
}) => {
  const [copied, setCopied] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [polishMessage, setPolishMessage] = useState<string | null>(null);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  // Average Persian reading speed: ~130-150 words/min = ~2.3 words/sec
  const estimatedSeconds = Math.max(1, Math.round(wordCount / 2.3));

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
      }
    } catch {
      // In case permissions are denied in iframe
    }
  };

  const handleBrowserSpeak = async () => {
    if (!text.trim()) return;

    if (isBrowserSpeaking) {
      stopBrowserSpeech();
      setIsBrowserSpeaking(false);
      return;
    }

    const rateMap = { slow: 0.8, normal: 1.0, fast: 1.25 };
    const playbackRate = rateMap[speed] || 1.0;

    try {
      await speakPersianBrowser(text.trim(), {
        voiceId: selectedVoice,
        rate: playbackRate,
        onStart: () => setIsBrowserSpeaking(true),
        onEnd: () => setIsBrowserSpeaking(false),
        onError: () => setIsBrowserSpeaking(false),
      });
    } catch {
      setIsBrowserSpeaking(false);
    }
  };

  const handlePolish = async (mode: "fluency" | "diacritics" | "colloquial" | "formal") => {
    if (!text.trim() || isPolishing) return;
    setIsPolishing(true);
    setPolishMessage("در حال پردازش متن با هوش مصنوعی...");
    try {
      const res = await fetch("/api/persian/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = await res.json();
      if (data.polishedText) {
        setText(data.polishedText);
        setPolishMessage("متن با موفقیت بهینه‌سازی و سلیس شد!");
        setTimeout(() => setPolishMessage(null), 3000);
      } else if (data.error) {
        setPolishMessage(data.error);
        setTimeout(() => setPolishMessage(null), 4000);
      }
    } catch (err) {
      setPolishMessage("خطا در برقراری ارتباط با سرور");
      setTimeout(() => setPolishMessage(null), 3000);
    } finally {
      setIsPolishing(false);
    }
  };

  const currentVoiceObj = VOICES.find((v) => v.id === selectedVoice) || VOICES.find((v) => v.id === "Fenrir") || VOICES[0];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative backdrop-blur-sm">
      {/* Header bar of text area */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-slate-200">
            متن مورد نظر برای گویندگی
          </span>
        </div>

        {/* Action icons & presets dropdown */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/40 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>نمونه متون سلیس</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showPresetsMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPresetsMenu(false)}
                />
                <div className="absolute left-0 mt-2 w-72 sm:w-80 max-h-96 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 divide-y divide-slate-800">
                  {PRESET_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="py-2 first:pt-0 last:pb-0">
                      <div className="text-[11px] font-bold text-indigo-400 px-2 py-1 flex items-center gap-1.5">
                        <span>{cat.titleFa}</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {cat.items.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onSelectPreset(
                                item.text,
                                item.suggestedVoice,
                                item.suggestedStyle
                              );
                              setShowPresetsMenu(false);
                            }}
                            className="w-full text-right px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex flex-col gap-0.5"
                          >
                            <span className="font-medium text-slate-200">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handlePaste}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
            title="چسباندن متن"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">جای‌گذاری</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1 disabled:opacity-40"
            title="کپی متن"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">کپی شد</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">کپی</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setText("")}
            disabled={!text}
            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors text-xs flex items-center gap-1 disabled:opacity-40"
            title="پاک کردن متن"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">پاکسازی</span>
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          dir="rtl"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="متن فارسی خود را اینجا بنویسید یا بچسبانید تا با تلفظ روان و طبیعی خوانده شود... (مثال: سلام، امروز روز بسیار خوبی است و می‌خواهم درباره زیبایی‌های زبان فارسی صحبت کنم.)"
          rows={6}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-base leading-relaxed resize-y font-normal transition-all"
        />

        {polishMessage && (
          <div className="absolute bottom-3 right-3 left-3 bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-lg text-xs flex items-center justify-between backdrop-blur-md animate-fade-in z-10">
            <span>{polishMessage}</span>
          </div>
        )}
      </div>

      {/* Text Enhancement Assistant Toolbar */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: AI polish helpers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Wand2 className="w-3 h-3 text-amber-400" />
            روان‌سازی با هوش مصنوعی:
          </span>

          <button
            type="button"
            disabled={!text.trim() || isPolishing}
            onClick={() => handlePolish("diacritics")}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-40 flex items-center gap-1"
            title="افزودن اعراب و حرکات صحیح برای کلمات دوپهلو یا شعر"
          >
            {isPolishing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            <span>اعراب‌گذاری دقیق (شعر/کلمات سخت)</span>
          </button>

          <button
            type="button"
            disabled={!text.trim() || isPolishing}
            onClick={() => handlePolish("fluency")}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-40 flex items-center gap-1"
            title="بهینه‌سازی علائم نگارشی و تلفظ روان"
          >
            <span>روان‌سازی و سلیس کردن</span>
          </button>

          <button
            type="button"
            disabled={!text.trim() || isPolishing}
            onClick={() => handlePolish("colloquial")}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-40 flex items-center gap-1"
            title="تبدیل به بیان محاوره‌ای و گرم"
          >
            <span>لحن گفتاری و خودمانی</span>
          </button>
        </div>

        {/* Right: Word/Char Counter & Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mr-auto">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>حدود {estimatedSeconds} ثانیه</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>{wordCount} کلمه</span>
          <span className="text-slate-600">•</span>
          <span>{charCount} کاراکتر</span>
        </div>
      </div>

      {/* Main Speak CTA Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Instant Browser Speech Playback */}
        <button
          type="button"
          onClick={handleBrowserSpeak}
          disabled={!text.trim()}
          className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
            isBrowserSpeaking
              ? "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20 animate-pulse"
              : "bg-slate-800 hover:bg-slate-700/90 text-slate-200 border-slate-700/80 hover:text-white"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={`پخش صوتی با صدای ${currentVoiceObj.nameFa} (${currentVoiceObj.genderFa})`}
        >
          {isBrowserSpeaking ? (
            <>
              <Square className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>توقف خوانش ({currentVoiceObj.nameFa})</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              <span>پخش صوتی فوری با {currentVoiceObj.nameFa}</span>
            </>
          )}
        </button>

        {/* Gemini AI TTS Button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={!text.trim() || isLoading}
          className="w-full sm:w-auto min-w-[240px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>در حال ساخت صدای سلیس هوش مصنوعی...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>تولید صوت استودیویی (Gemini AI)</span>
              <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
