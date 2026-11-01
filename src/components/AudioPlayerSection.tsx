import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Repeat,
  Sparkles,
  Share2,
  Check,
  Music,
  FolderCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  base64ToBlobUrl,
  saveAudioToDevice,
  canShareAudioFile,
  isNativeApp,
  formatTime,
  SaveAudioResult,
} from "../utils/audio";
import { VOICES } from "../data/presets";

interface AudioPlayerSectionProps {
  audioData: string | null; // base64 WAV
  spokenText: string;
  voiceName: string;
  style: string;
  onClearAudio?: () => void;
}

export const AudioPlayerSection: React.FC<AudioPlayerSectionProps> = ({
  audioData,
  spokenText,
  voiceName,
  style,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    title: string;
    description: string;
    filename?: string;
    blobUrl?: string;
  } | null>(null);

  // Generate audio blob URL whenever audioData changes
  useEffect(() => {
    if (!audioData) {
      setAudioUrl(null);
      setFeedback(null);
      return;
    }
    const url = base64ToBlobUrl(audioData, "audio/wav");
    setAudioUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [audioData]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [audioUrl]);

  // Auto-play when new audio is loaded
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay may require user gesture in some browsers
      });
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) {
      audioRef.current.loop = next;
    }
  };

  // Direct download handler (saves to Downloads folder)
  const handleDownload = async () => {
    if (!audioData || isSaving) return;
    setIsSaving(true);
    const filename = `persian-voice-${voiceName.toLowerCase()}-${Date.now()}.wav`;

    try {
      const result: SaveAudioResult = await saveAudioToDevice(
        audioData,
        filename,
        "direct_download"
      );

      if (result.success) {
        setFeedback({
          type: "success",
          title: "فایل صوتی ذخیره شد!",
          description:
            result.message ||
            `فایل با نام ${filename} در پوشه بارگیری‌ها (Downloads) دستگاه شما ذخیره گردید.`,
          filename,
          blobUrl: audioUrl || undefined,
        });
      } else {
        setFeedback({
          type: "error",
          title: "خطا در دانلود خودکار",
          description:
            result.error ||
            "اگر دانلود آغاز نشد، می‌توانید از دکمه «اشتراک‌گذاری / ذخیره در گوشی» استفاده نمایید یا مستقیماً روی لینک باز کردن کلیک کنید.",
          filename,
          blobUrl: audioUrl || undefined,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Native share / phone storage saver handler
  const handleShareOrSavePhone = async () => {
    if (!audioData || isSaving) return;
    setIsSaving(true);
    const filename = `persian-voice-${voiceName.toLowerCase()}-${Date.now()}.wav`;

    try {
      const result: SaveAudioResult = await saveAudioToDevice(
        audioData,
        filename,
        "share"
      );

      if (result.success) {
        setFeedback({
          type: "success",
          title: "عملیات ذخیره با موفقیت انجام شد",
          description:
            result.message ||
            "پنجره ذخیره یا اشتراک‌گذاری در دستگاه باز شد. می‌توانید گزینه ذخیره در فایل‌ها یا تلگرام/واتساپ را انتخاب کنید.",
          filename,
          blobUrl: audioUrl || undefined,
        });
      } else {
        // Fallback to direct download
        await handleDownload();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Text highlighting progress
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const words = spokenText.split(/\s+/);
  const activeWordIndex = Math.min(
    words.length - 1,
    Math.floor(progressRatio * words.length)
  );

  if (!audioData || !audioUrl) {
    return (
      <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-center mx-auto mb-3">
          <Music className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="font-bold text-slate-200 text-sm mb-1">
          پخش‌کننده صوت آماده است
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          متن خود را در کادر بالا بنویسید و روی دکمه «تولید صوت استودیویی» کلیک کنید تا صوت با کیفیت استودیویی ایجاد شود.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background ambient glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} loop={isLooping} />

      {/* Top Bar with metadata and download */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-indigo-900/40 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-white">
                صوت تولید شده با گوینده {VOICES.find((v) => v.id === voiceName)?.nameFa || voiceName}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                سبک: {style}
              </span>
              {VOICES.find((v) => v.id === voiceName) && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {VOICES.find((v) => v.id === voiceName)?.genderFa}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary Save / Share button (especially vital for Android and mobile users) */}
          <button
            type="button"
            onClick={handleShareOrSavePhone}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-all hover:scale-105 active:scale-95 shadow-md"
            title="ذخیره مستقیم در فایل‌های گوشی، تلگرام، واتساپ یا مدیریت دانلودها"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSaving ? "در حال آماده‌سازی..." : "ذخیره در گوشی / اشتراک‌گذاری"}</span>
          </button>

          {/* Direct File Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            title="دانلود مستقیم فایل صوتی WAV در پوشه Downloads"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود فایل صوتی (WAV)</span>
          </button>
        </div>
      </div>

      {/* Prominent Save / Download Confirmation & Guidance Banner */}
      {feedback && (
        <div
          className={`mb-4 p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 relative z-10 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
              : "bg-amber-950/60 border-amber-500/40 text-amber-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === "success" ? (
              <FolderCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-sm mb-0.5">{feedback.title}</span>
              <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                {feedback.description}
              </p>
              {feedback.filename && (
                <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-900/70 px-2 py-0.5 rounded border border-slate-700">
                  📁 نام فایل: {feedback.filename}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {feedback.blobUrl && (
              <a
                href={feedback.blobUrl}
                download={feedback.filename || "persian-tts.wav"}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium border border-slate-600 flex items-center gap-1 transition"
                title="دانلود مجدد فایل"
              >
                <Download className="w-3 h-3" />
                <span>لینک دانلود مجدد</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-[11px]"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* Animated Waveform Visualizer */}
      <div className="py-4 relative z-10">
        <div className="h-16 flex items-center justify-center gap-1 sm:gap-1.5 px-2 bg-slate-950/60 rounded-xl border border-indigo-950 p-2">
          {Array.from({ length: 36 }).map((_, i) => {
            // Dynamic bar height based on playback state and index
            const isNearCurrent =
              Math.abs(i / 36 - progressRatio) < 0.08 && isPlaying;
            const barHeight = isPlaying
              ? Math.max(
                  15,
                  Math.sin(i * 0.4 + currentTime * 8) * 35 + 45
                )
              : Math.max(10, Math.sin(i * 0.5) * 20 + 25);

            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-75"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor:
                    i / 36 <= progressRatio
                      ? isNearCurrent
                        ? "#f59e0b" // Amber active wave
                        : "#6366f1" // Indigo completed wave
                      : "#334155", // Slate inactive
                  boxShadow:
                    isNearCurrent && isPlaying
                      ? "0 0 10px rgba(245, 158, 11, 0.8)"
                      : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Spoken Text Karaoke / Follower View */}
      {spokenText && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm leading-relaxed max-h-32 overflow-y-auto relative z-10">
          <div className="text-[11px] font-semibold text-indigo-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>متن در حال قرائت:</span>
          </div>
          <div className="text-slate-300 flex flex-wrap gap-x-1.5 gap-y-1">
            {words.map((word, idx) => {
              const isSpoken = idx <= activeWordIndex && currentTime > 0;
              const isCurrent = idx === activeWordIndex && isPlaying;
              return (
                <span
                  key={idx}
                  className={`transition-all duration-150 rounded px-1 ${
                    isCurrent
                      ? "bg-amber-500/30 text-amber-200 font-bold underline decoration-amber-400"
                      : isSpoken
                      ? "text-indigo-200"
                      : "text-slate-400"
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Bar & Time */}
      <div className="mt-4 relative z-10 space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
        />
        <div className="flex justify-between text-xs font-mono text-slate-400 px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Playback Controls */}
      <div className="mt-4 pt-3 border-t border-indigo-900/30 flex flex-wrap items-center justify-between gap-4 relative z-10">
        {/* Left: Speed Rate & Loop */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/80 rounded-lg border border-slate-800 p-0.5 text-xs">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  playbackRate === rate
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleLoop}
            className={`p-2 rounded-lg border transition-colors ${
              isLooping
                ? "bg-indigo-950 border-indigo-500 text-indigo-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title={isLooping ? "تکرار فعال است" : "فعال‌سازی تکرار خودکار"}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Play, Pause, Restart */}
        <div className="flex items-center gap-3 mx-auto">
          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all active:scale-95"
            title="پخش مجدد از ابتدا"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? "توقف موقت" : "پخش"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
