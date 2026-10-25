export interface VoiceOption {
  id: string;
  name: string;
  nameFa: string;
  gender: "female" | "male";
  genderFa: string;
  accentNote: string;
  description: string;
  personality: string;
  tag: string;
}

export interface SpeechStyle {
  id: "natural" | "poetic" | "story" | "formal" | "conversational" | "energetic";
  labelFa: string;
  descFa: string;
  iconName: string;
}

export interface AudioHistoryItem {
  id: string;
  text: string;
  voiceName: string;
  style: string;
  speed: string;
  audioData: string; // base64 WAV
  mimeType: string;
  createdAt: string;
  duration?: number;
}

export interface PresetCategory {
  id: string;
  titleFa: string;
  icon: string;
  items: {
    title: string;
    text: string;
    suggestedVoice: string;
    suggestedStyle: "natural" | "poetic" | "story" | "formal" | "conversational" | "energetic";
  }[];
}
