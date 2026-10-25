import React from "react";
import { History, Play, Download, Trash2, Clock, Volume2, Sparkles } from "lucide-react";
import { AudioHistoryItem } from "../types";
import { downloadAudioFile } from "../utils/audio";

interface SpeechHistoryProps {
  history: AudioHistoryItem[];
  onSelectHistory: (item: AudioHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteOne: (id: string) => void;
}

export const SpeechHistory: React.FC<SpeechHistoryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
  onDeleteOne,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h2 className="font-bold text-sm text-slate-200">
            تاریخچه صداهای تولید شده
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {history.length} مورد
          </span>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 hover:bg-rose-950/30 px-2 py-1 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>پاکسازی تاریخچه</span>
        </button>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div
              onClick={() => onSelectHistory(item)}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-xs text-indigo-300">
                  {item.voiceName}
                </span>
                <span className="text-[10px] text-slate-500">•</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.createdAt}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/40">
                  {item.style}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 group-hover:text-white transition-colors">
                {item.text}
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => onSelectHistory(item)}
                className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                title="پخش این صوت"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="text-[11px]">پخش</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadAudioFile(
                    item.audioData,
                    `persian-voice-${item.voiceName}-${item.id}.wav`
                  )
                }
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="دانلود فایل صوتی"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteOne(item.id)}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                title="حذف از تاریخچه"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
