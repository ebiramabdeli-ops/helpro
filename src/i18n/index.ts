import en from './en';
import sv from './sv';
import de from './de';
import es from './es';
import fr from './fr';
import it from './it';
import no from './no';
import dk from './dk';
import fi from './fi';
import nl from './nl';
import pt from './pt';
import pl from './pl';
import ro from './ro';
import el from './el';

/**
 * Supported Languages (Final Set)
 * 
 * ONLY these 15 languages are supported across the entire platform:
 * - en-GB: English (UK)
 * - en-IE: English (Ireland)
 * - de-DE: German
 * - fr-FR: French
 * - es-ES: Spanish
 * - it-IT: Italian
 * - sv-SE: Swedish
 * - nb-NO: Norwegian
 * - da-DK: Danish
 * - fi-FI: Finnish
 * - nl-NL: Dutch
 * - pt-PT: Portuguese
 * - pl-PL: Polish
 * - ro-RO: Romanian
 * - el-GR: Greek
 * 
 * Important:
 * ❌ No auto-translation
 * ❌ No uncontrolled languages
 * ✅ All text manually translated for trust, legal clarity, and cost control
 */
export type Locale = 
  | 'en-GB'  // English (UK)
  | 'en-IE'  // English (Ireland)
  | 'de-DE'  // German
  | 'fr-FR'  // French
  | 'es-ES'  // Spanish
  | 'it-IT'  // Italian
  | 'sv-SE'  // Swedish
  | 'nb-NO'  // Norwegian
  | 'da-DK'  // Danish
  | 'fi-FI'  // Finnish
  | 'nl-NL'  // Dutch
  | 'pt-PT'  // Portuguese
  | 'pl-PL'  // Polish
  | 'ro-RO'  // Romanian
  | 'el-GR'; // Greek

// Legacy support: map old codes to new codes
const LOCALE_MAP: Record<string, Locale> = {
  'en': 'en-GB',
  'sv': 'sv-SE',
  'de': 'de-DE',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'it': 'it-IT',
  'no': 'nb-NO',
  'dk': 'da-DK',
  'fi': 'fi-FI',
  'nl': 'nl-NL',
  'pt': 'pt-PT',
  'pl': 'pl-PL',
  'ro': 'ro-RO',
  'el': 'el-GR',
};

export type LocaleCode = keyof typeof LOCALE_MAP;

// Legacy translations using old codes
const legacyTranslations = { en, sv, de, es, fr, it, no, dk, fi, nl, pt, pl, ro, el };

// Map new locale codes to legacy translations
const translations: Record<Locale, any> = {
  'en-GB': en,
  'en-IE': en, // Share English translations
  'de-DE': de,
  'fr-FR': fr,
  'es-ES': es,
  'it-IT': it,
  'sv-SE': sv,
  'nb-NO': no,
  'da-DK': dk,
  'fi-FI': fi,
  'nl-NL': nl,
  'pt-PT': pt,
  'pl-PL': pl,
  'ro-RO': ro,
  'el-GR': el,
};

/**
 * Translate a key to the user's locale.
 * 
 * Usage:
 * ```typescript
 * t('home.title', 'en-GB') // "Help from trusted people near you"
 * t('button.book', 'de-DE') // "Jetzt buchen"
 * ```
 */
export function t(key: string, locale: Locale = 'en-GB'): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

/**
 * Get user's current locale from storage.
 * Falls back to en-GB if not set.
 */
export function getLocale(): Locale {
  const stored = localStorage.getItem('helpro_language') || sessionStorage.getItem('helpro_language');
  
  // Handle legacy locale codes
  if (stored && stored in LOCALE_MAP) {
    return LOCALE_MAP[stored];
  }
  
  return (stored as Locale) || 'en-GB';
}

/**
 * Set user's locale in storage.
 */
export function setLocale(locale: Locale): void {
  localStorage.setItem('helpro_language', locale);
  sessionStorage.setItem('helpro_language', locale);
}

/**
 * Get speech recognition language code for a locale.
 * Used for Web Speech API.
 */
export function getSpeechLang(locale: Locale): string {
  const map: Record<Locale, string> = {
    'en-GB': 'en-GB',
    'en-IE': 'en-IE',
    'de-DE': 'de-DE',
    'fr-FR': 'fr-FR',
    'es-ES': 'es-ES',
    'it-IT': 'it-IT',
    'sv-SE': 'sv-SE',
    'nb-NO': 'nb-NO',
    'da-DK': 'da-DK',
    'fi-FI': 'fi-FI',
    'nl-NL': 'nl-NL',
    'pt-PT': 'pt-PT',
    'pl-PL': 'pl-PL',
    'ro-RO': 'ro-RO',
    'el-GR': 'el-GR',
  };
  
  return map[locale] || 'en-GB';
}

/**
 * Get all supported locales.
 */
export function getSupportedLocales(): Locale[] {
  return [
    'en-GB',
    'en-IE',
    'de-DE',
    'fr-FR',
    'es-ES',
    'it-IT',
    'sv-SE',
    'nb-NO',
    'da-DK',
    'fi-FI',
    'nl-NL',
    'pt-PT',
    'pl-PL',
    'ro-RO',
    'el-GR',
  ];
}

/**
 * Detect user's preferred locale based on browser settings.
 * Falls back to en-GB if no match found.
 */
export function detectLocale(): Locale {
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Exact match
  if (translations[browserLang as Locale]) {
    return browserLang as Locale;
  }
  
  // Match language code only (e.g., 'en' → 'en-GB')
  const langCode = browserLang.split('-')[0];
  if (langCode in LOCALE_MAP) {
    return LOCALE_MAP[langCode];
  }
  
  // Check if browser language starts with any supported locale
  for (const locale of getSupportedLocales()) {
    if (browserLang.startsWith(locale.split('-')[0])) {
      return locale;
    }
  }
  
  return 'en-GB'; // Default fallback
}

/**
 * Hook to use translations in components
 */
export function useTranslation() {
  const locale = getCurrentLocale();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
  
  return { t, locale };
}

export default translations;
