import React, { useState, useEffect } from "react";
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, ShieldCheck, Trash2, X, RefreshCw } from "lucide-react";
import { getPermanentApiKey, setPermanentApiKey, removePermanentApiKey, verifyApiKeyRemote } from "../utils/apiKeyManager";

interface PermanentKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const PermanentKeyModal: React.FC<PermanentKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<{
    valid?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getPermanentApiKey();
      setApiKeyInput(current);
      setVerifyResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    setPermanentApiKey(trimmed);
    onKeySaved(trimmed);
    onClose();
  };

  const handleTestKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setVerifyResult({ valid: false, message: "لطفاً ابتدا کلید API را وارد کنید." });
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyApiKeyRemote(trimmed);
      if (result.valid) {
        setVerifyResult({
          valid: true,
          message: "تبریک! کلید دائمی با موفقیت تایید شد و آماده استفاده است.",
        });
      } else {
        setVerifyResult({
          valid: false,
          message: result.error || "کلید نامعتبر است.",
        });
      }
    } catch {
      setVerifyResult({
        valid: false,
        message: "خطا در برقراری ارتباط برای بررسی کلید.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = () => {
    removePermanentApiKey();
    setApiKeyInput("");
    setVerifyResult(null);
    onKeySaved("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                تنظیم کلید دائمی هوش مصنوعی
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Gemini API Key
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ذخیره دائمی روی دستگاه شما جهت استفاده بدون محدودیت در وب و اپلیکیشن اندروید
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Input field */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-200">
              کلید اختصاصی Gemini API شما
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setVerifyResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pl-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 text-slate-400 hover:text-slate-200"
                title={showKey ? "مخفی‌سازی کلید" : "نمایش کلید"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Verification Status */}
          {verifyResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                verifyResult.valid
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/50 border-rose-500/40 text-rose-200"
              }`}
            >
              {verifyResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{verifyResult.message}</span>
            </div>
          )}

          {/* Test & Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isVerifying || !apiKeyInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
              <span>{isVerifying ? "در حال اعتبارسنجی..." : "تست اعتبار کلید"}</span>
            </button>

            {getPermanentApiKey() && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف کلید</span>
              </button>
            )}
          </div>

          {/* How to get a free key info box */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <ShieldCheck className="w-4 h-4" />
              <span>چگونه کلید دائمی و رایگان دریافت کنم؟</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed pr-1 text-[11px]">
              <li>
                وارد پرتال{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 underline inline-flex items-center gap-0.5 hover:text-indigo-300"
                >
                  Google AI Studio (بخش API Keys)
                  <ExternalLink className="w-3 h-3 inline" />
                </a>{" "}
                شوید.
              </li>
              <li>روی گزینه «Create API Key» کلیک کنید.</li>
              <li>کلید ساخته شده را کپی کرده و در کادر بالا قرار داده و دکمه ذخیره را بزنید.</li>
              <li>این کلید دائمی است، منقضی نمی‌شود و برای خوانش نامحدود متون فارسی کافیست.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!apiKeyInput.trim()}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition"
          >
            ذخیره دائمی کلید
          </button>
        </div>
      </div>
    </div>
  );
};
