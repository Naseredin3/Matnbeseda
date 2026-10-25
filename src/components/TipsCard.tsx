import React from "react";
import { Lightbulb, Info, CheckCircle2, HelpCircle } from "lucide-react";

export const TipsCard: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm">
        <Lightbulb className="w-4 h-4" />
        <h3>نکات طلایی برای رسیدن به نهایت سلیس بودن و روانی گفتار فارسی</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-400 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>علامت‌گذاری و مکث‌ها (ویرگول و نقطه)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            گذاشتن ویرگول (،) باعث ایجاد مکث کوتاه طبیعی و لحن‌بندی گوش‌نواز می‌شود. انتهای جملات حتماً از نقطه (.) استفاده کنید.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>اعراب‌گذاری کلمات چندخوانشی</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            برای کلماتی مانند «کِتاب / کَتّاب»، «مِهر / مُهر» یا در شعر که خوانش دقیق مهم است، از دکمه «اعراب‌گذاری دقیق» استفاده کنید.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>انتخاب لحن متناسب با موضوع</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            برای اشعار از سبک «شعر و ادبیات فاخر» و برای تیزر و مکالمه از «صمیمی و خودمانی» استفاده کنید تا ادای کلمات زنده باشد.
          </p>
        </div>
      </div>
    </div>
  );
};
