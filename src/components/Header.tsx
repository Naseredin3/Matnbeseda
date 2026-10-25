import React from "react";
import { Volume2, Radio, KeyRound, Check } from "lucide-react";

interface HeaderProps {
  isLoading: boolean;
  hasPermanentKey: boolean;
  onOpenKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoading,
  hasPermanentKey,
  onOpenKeyModal,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                گوینده هوشمند فارسی
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  Gemini TTS Flash
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              تولید گفتار صوتی فارسی کاملاً سلیس، روان، رسا و زنده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Permanent Key Button */}
          <button
            type="button"
            onClick={onOpenKeyModal}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              hasPermanentKey
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 shadow-sm"
                : "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40 shadow-sm shadow-amber-500/10"
            }`}
            title="تنظیم و مدیریت کلید دائمی هوش مصنوعی"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{hasPermanentKey ? "کلید دائمی فعال است" : "تعیین کلید دائمی"}</span>
            {hasPermanentKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Status badge */}
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">در حال سنتز گفتار سلیس فارسی...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="hidden sm:inline">موتور صوتی آماده</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
