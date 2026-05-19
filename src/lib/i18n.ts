// Minimal i18n plumbing. Hindi UI is Phase H; English strings ship now.

export type Locale = "en" | "hi";

export const DEFAULT_LOCALE: Locale = "en";

type StringTable = Record<string, { en: string; hi?: string }>;

export const STRINGS: StringTable = {
  site_tagline: {
    en: "Daily mandi prices across India",
    hi: "देशभर की मंडियों के दैनिक भाव",
  },
  nav_pulse: { en: "Daily Pulse", hi: "आज का बाज़ार" },
  nav_commodities: { en: "Commodities", hi: "फ़सलें" },
  nav_mandis: { en: "Mandis", hi: "मंडियाँ" },
  nav_states: { en: "States", hi: "राज्य" },
  nav_about: { en: "About", hi: "परिचय" },
  search_placeholder: {
    en: "Search commodity, mandi or state — e.g. tomato, Nashik, Punjab",
    hi: "फ़सल, मंडी या राज्य खोजें — जैसे टमाटर, नासिक, पंजाब",
  },
  top_gainers: { en: "Top gainers", hi: "बढ़त" },
  top_losers: { en: "Top losers", hi: "गिरावट" },
  modal_price: { en: "Modal price", hi: "औसत भाव" },
  per_quintal: { en: "per quintal", hi: "प्रति क्विंटल" },
  per_kg: { en: "per kg", hi: "प्रति किलो" },
  data_updated: { en: "Data updated", hi: "अद्यतन" },
  disclaimer: {
    en: "Prices sourced from AGMARKNET (Govt of India). Mandi Mitra is an independent project. Verify before commercial decisions.",
    hi: "भाव AGMARKNET (भारत सरकार) से लिए गए हैं। Mandi Mitra एक स्वतंत्र परियोजना है। व्यावसायिक निर्णय से पहले स्वयं जाँच करें।",
  },
  empty_no_data: {
    en: "No mandis reported this commodity today. Try yesterday.",
    hi: "आज इस फ़सल का कोई भाव नहीं आया। कल का भाव देखें।",
  },
};

export function t(key: keyof typeof STRINGS, locale: Locale = DEFAULT_LOCALE): string {
  const row = STRINGS[key];
  return row?.[locale] ?? row?.en ?? key;
}
