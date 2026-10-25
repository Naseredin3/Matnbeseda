import React from "react";
import {
  Mic2,
  Sliders,
  Sparkles,
  Feather,
  BookOpen,
  Newspaper,
  MessageCircleHeart,
  Flame,
  User,
  Gauge,
  Volume2,
} from "lucide-react";
import { VOICES, SPEECH_STYLES } from "../data/presets";
import { VoiceOption, SpeechStyle } from "../types";

interface VoiceSelectorProps {
  selectedVoice: string;
  setSelectedVoice: (id: string) => void;
  selectedStyle: "natural" | "poetic" | "story" | "formal" | "conversational" | "energetic";
  setSelectedStyle: (id: any) => void;
  speed: "slow" | "normal" | "fast";
  setSpeed: (spd: "slow" | "normal" | "fast") => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  setSelectedVoice,
  selectedStyle,
  setSelectedStyle,
  speed,
  setSpeed,
}) => {
  const getStyleIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case "Feather":
        return <Feather className="w-4 h-4 text-amber-400" />;
      case "BookOpen":
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case "Newspaper":
        return <Newspaper className="w-4 h-4 text-sky-400" />;
      case "MessageCircleHeart":
        return <MessageCircleHeart className="w-4 h-4 text-rose-400" />;
      case "Flame":
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Voice Persona Selection */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-sm text-slate-200">
              انتخاب گوینده صوتی (Voice Persona)
            </h2>
          </div>
          <span className="text-xs text-indigo-400 font-medium px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/40">
            {VOICES.length} صدای اختصاصی
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VOICES.map((v) => {
            const isSelected = selectedVoice === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVoice(v.id)}
                className={`text-right p-3.5 rounded-xl border transition-all relative flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? "bg-indigo-950/70 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500"
                    : "bg-slate-950/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {v.gender === "female" ? "♀" : "♂"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {v.nameFa}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({v.name})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {v.personality}
                      </span>
                    </div>
                  </div>

                  {v.tag && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
                      }`}
                    >
                      {v.tag}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300/90 leading-relaxed">
                  {v.description}
                </p>

                <div className="pt-2 border-t border-slate-800/60 w-full flex items-center justify-between text-[11px] text-slate-400">
                  <span>لحن: {v.accentNote}</span>
                  <span
                    className={`font-semibold ${
                      isSelected ? "text-indigo-400" : "text-slate-500"
                    }`}
                  >
                    {isSelected ? "✓ انتخاب شده" : "انتخاب"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Speech Style and Pace Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Style selection (2 cols) */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-sm text-slate-200">
                لحن و سبک خوانش فارسی
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              جهت‌دهی به حس و آهنگ کلام
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SPEECH_STYLES.map((st) => {
              const isSelected = selectedStyle === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`text-right p-3 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-indigo-950/80 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      {getStyleIcon(st.iconName)}
                      {st.labelFa}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {st.descFa}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Speed / Pace Selector (1 col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-sm text-slate-200">
                  سرعت ادای کلمات
                </h2>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {[
                { id: "slow", label: "آرام و شمرده (0.8x)", desc: "برای آموزش یا شعر" },
                { id: "normal", label: "استاندارد و طبیعی (1.0x)", desc: "سرعت معمول گفتار" },
                { id: "fast", label: "سریع و روان (1.2x)", desc: "برای پادکست و نریشن" },
              ].map((s) => {
                const isSelected = speed === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpeed(s.id as any)}
                    className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-amber-950/50 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/50 font-bold"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div>{s.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {s.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-amber-400 font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>خروجی با کیفیت استودیویی ۲۴ کیلوهرتز (24kHz Studio HD)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
