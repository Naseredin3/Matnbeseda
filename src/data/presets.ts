import { VoiceOption, SpeechStyle, PresetCategory } from "../types";

export const VOICES: VoiceOption[] = [
  {
    id: "Kore",
    name: "Kore",
    nameFa: "کوره (بانو)",
    gender: "female",
    genderFa: "زنانه",
    accentNote: "شفاف، گرم و گویندگی استاندارد",
    description: "صدایی دلنشین، رسا و بسیار روان، ایده‌آل برای روایتگری، پادکست و متون عمومی فارسی.",
    personality: "گرم و سلیس",
    tag: "پیشنهاد اصلی",
  },
  {
    id: "Puck",
    name: "Puck",
    nameFa: "پاک (آقا)",
    gender: "male",
    genderFa: "مردانه",
    accentNote: "پویا، جوان و دوستانه",
    description: "صدایی شاداب و صمیمی مناسب مکالمات روزمره، تیزرهای تبلیغاتی و محتوای پرانرژی.",
    personality: "شاداب و پرانرژی",
    tag: "پویا",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    nameFa: "فنریر (آقا)",
    gender: "male",
    genderFa: "مردانه",
    accentNote: "عمیق، مقتدر و بم",
    description: "صدایی با طنین بم و رسمی، فوق‌العاده برای اخبار، مستندهای تاریخی، اشعار حماسی و کتاب صوتی.",
    personality: "مقتدر و حماسی",
    tag: "بم و سینمایی",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    nameFa: "زفیر (بانو)",
    gender: "female",
    genderFa: "زنانه",
    accentNote: "آرامش‌بخش، ملایم و نرم",
    description: "لحنی لطیف و آرام، مناسب متون مدیتیشن، داستان‌های قبل از خواب و دل‌نوشته‌های عاشقانه.",
    personality: "آرام و گوش‌نواز",
    tag: "ملایم",
  },
  {
    id: "Charon",
    name: "Charon",
    nameFa: "کارون (آقا)",
    gender: "male",
    genderFa: "مردانه",
    accentNote: "پخته، کلاسیک و متین",
    description: "صدایی سنجیده و جاافتاده برای خوانش متون علمی، متون کهن فارسی و تحلیل‌های تخصصی.",
    personality: "فاخر و متین",
    tag: "کلاسیک",
  },
  {
    id: "Aoede",
    name: "Aoede",
    nameFa: "آئوده (بانو)",
    gender: "female",
    genderFa: "زنانه",
    accentNote: "شفاف، آکادمیک و شیوا",
    description: "صدای زنانه واضح و بدون لهجه اضافی، عالی برای آموزش، کتاب‌های صوتی و مقالات.",
    personality: "روشن و دقیق",
    tag: "آموزشی",
  },
];

export const SPEECH_STYLES: SpeechStyle[] = [
  {
    id: "natural",
    labelFa: "طبیعی و سلیس",
    descFa: "خوانش روان، متوازن و روزمره با لحن استاندارد فارسی",
    iconName: "Sparkles",
  },
  {
    id: "poetic",
    labelFa: "شعر و ادبیات فاخر",
    descFa: "بیان احساسی، موزون و با وقار مناسب غزل و متون کلاسیک",
    iconName: "Feather",
  },
  {
    id: "story",
    labelFa: "روایتگری و داستان",
    descFa: "لحن جذاب، درگیرکننده و گرم با نوسانات بیانی قصه‌گویی",
    iconName: "BookOpen",
  },
  {
    id: "formal",
    labelFa: "رسمی و خبری",
    descFa: "بیان محکم، شفاف، مقتدر و مناسب اطلاعیه‌ها و اخبار",
    iconName: "Newspaper",
  },
  {
    id: "conversational",
    labelFa: "صمیمی و خودمانی",
    descFa: "لحن دوستانه و نزدیک برای مکالمات و پیام‌های شخصی",
    iconName: "MessageCircleHeart",
  },
  {
    id: "energetic",
    labelFa: "پرانرژی و انگیزشی",
    descFa: "ریتم تندتر، پرشور و پرانگیزه برای تیزر و سخنرانی",
    iconName: "Flame",
  },
];

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: "literature",
    titleFa: "شعر و ادب پارسی",
    icon: "Scroll",
    items: [
      {
        title: "غزل حافظ شیرازی",
        text: "اگر آن تُرکِ شیرازی به دست آرد دلِ ما را، به خالِ هِندویَش بخشم سمرقند و بخارا را. بده ساقی میِ باقی که در جنّت نخواهی یافت، کنارِ آبِ رُکنابادی و گلگشتِ مُصَلّی را.",
        suggestedVoice: "Fenrir",
        suggestedStyle: "poetic",
      },
      {
        title: "سعدی - گلستان",
        text: "بنی آدم اعضای یکدیگرند، که در آفرینش ز یک گوهرند. چو عضوی به درد آورد روزگار، دگر عضوها را نماند قرار. تو کز محنت دیگران بی غمی، نشاید که نامت نهند آدمی.",
        suggestedVoice: "Charon",
        suggestedStyle: "poetic",
      },
      {
        title: "مولانا - دیوان شمس",
        text: "بشنو از نی چون حکایت می‌کند، از جدایی‌ها شکایت می‌کند. کز نیستان تا مرا ببریده‌اند، در نفیرم مرد و زن نالیده‌اند. سینه خواهم شرحه شرحه از فراق، تا بگویم شرح درد اشتیاق.",
        suggestedVoice: "Zephyr",
        suggestedStyle: "poetic",
      },
    ],
  },
  {
    id: "story",
    titleFa: "داستان و روایت",
    icon: "BookOpen",
    items: [
      {
        title: "روایت شب کویری",
        text: "شب در کویر آرام آرام چادر سرمه‌ای‌اش را می‌گسترد. ستارگان چنان زلال و نزدیک می‌درخشیدند که گویی با دست کشیدن بر مخمل آسمان، می‌شد خوشه‌ای از نور چید و در دل به یادگار گذاشت.",
        suggestedVoice: "Kore",
        suggestedStyle: "story",
      },
      {
        title: "کتاب صوتی شازده کوچولو",
        text: "آدم‌ها این حقیقت را فراموش کرده‌اند؛ اما تو نباید فراموشش کنی. تو همیشه مسئولِ آن چیزی هستی که اهلی‌اش کرده‌ای. تو تا ابد مسئولِ گلِ خودت هستی.",
        suggestedVoice: "Zephyr",
        suggestedStyle: "story",
      },
    ],
  },
  {
    id: "news",
    titleFa: "رسمی، علمی و خبری",
    icon: "Newspaper",
    items: [
      {
        title: "گزارش دستاوردهای فناوری",
        text: "پژوهشگران به تازگی سامانه‌ای نوین مبتنی بر هوش مصنوعی توسعه داده‌اند که قادر است متون تخصصی را با رعایت کامل قواعد دستور زبان و لهجه‌های بومی به گفتاری طبیعی و سلیس تبدیل نماید.",
        suggestedVoice: "Aoede",
        suggestedStyle: "formal",
      },
      {
        title: "پیام خوش‌آمدگویی رسمی",
        text: "با سلام و درود به تمامی میهمانان گرامی. به همایش بین‌المللی علم و آینده خوش آمدید. امروز گرد هم آمده‌ایم تا تازه‌ترین دستاوردهای هوش مصنوعی را مرور کنیم.",
        suggestedVoice: "Charon",
        suggestedStyle: "formal",
      },
    ],
  },
  {
    id: "motivation",
    titleFa: "انگیزشی و مثبت",
    icon: "Sparkles",
    items: [
      {
        title: "شروعی پرانرژی",
        text: "امروز روز توست! هیچ مانعی نمی‌تواند در برابر اراده و انگیزه پولادین تو مقاومت کند. گام‌هایت را محکم بردار و با لبخند به استقبال رویاهایت برو، چون آینده در انتظار توست.",
        suggestedVoice: "Puck",
        suggestedStyle: "energetic",
      },
      {
        title: "آرامش درونی",
        text: "نفس عمیقی بکش و تمام دغدغه‌های دیروز را رها کن. هر لحظه از زندگی، آغازی تازه برای ساختن بهترین نسخه از خودت است. آرام باش و به قدرت درونت اعتماد کن.",
        suggestedVoice: "Zephyr",
        suggestedStyle: "natural",
      },
    ],
  },
  {
    id: "conversational",
    titleFa: "محاوره‌ای و روزمره",
    icon: "MessageCircle",
    items: [
      {
        title: "احوال‌پرسی دوستانه",
        text: "سلام دوست من! حالت چطوره؟ خیلی وقت بود ندیده بودمت، امیدوارم همه چیز عالی باشه و روزهای پر از موفقیتی رو سپری کنی.",
        suggestedVoice: "Puck",
        suggestedStyle: "conversational",
      },
      {
        title: "پیام تبریک عید",
        text: "عیدت حسابی مبارک باشه! آرزو می‌کنم سال جدید برات پر از سلامتی، برکت، خنده‌های از ته دل و لحظه‌های ناب و فراموش‌نشدنی باشه.",
        suggestedVoice: "Kore",
        suggestedStyle: "conversational",
      },
    ],
  },
];
