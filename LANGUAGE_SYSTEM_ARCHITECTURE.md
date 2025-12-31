# 🌍 LANGUAGE SYSTEM ARCHITECTURE

## Supported Languages (Final Set)

**ONLY these 15 languages are supported across the entire platform:**

| Code    | Language             | Native Name  | Flag | Priority |
|---------|---------------------|--------------|------|----------|
| en-GB   | English (UK)        | English (UK) | 🇬🇧   | 1        |
| en-IE   | English (Ireland)   | English (Ireland) | 🇮🇪 | 11      |
| de-DE   | German              | Deutsch      | 🇩🇪   | 2        |
| fr-FR   | French              | Français     | 🇫🇷   | 3        |
| es-ES   | Spanish             | Español      | 🇪🇸   | 4        |
| it-IT   | Italian             | Italiano     | 🇮🇹   | 5        |
| sv-SE   | Swedish             | Svenska      | 🇸🇪   | 6        |
| nb-NO   | Norwegian           | Norsk        | 🇳🇴   | 7        |
| da-DK   | Danish              | Dansk        | 🇩🇰   | 8        |
| fi-FI   | Finnish             | Suomi        | 🇫🇮   | 9        |
| nl-NL   | Dutch               | Nederlands   | 🇳🇱   | 10       |
| pt-PT   | Portuguese          | Português    | 🇵🇹   | 12       |
| pl-PL   | Polish              | Polski       | 🇵🇱   | 13       |
| ro-RO   | Romanian            | Română       | 🇷🇴   | 14       |
| el-GR   | Greek               | Ελληνικά     | 🇬🇷   | 15       |

## Core Principles

### ❌ What We DON'T Do
- ❌ **No auto-translation** - Every string manually translated
- ❌ **No uncontrolled languages** - Only these 15 languages supported
- ❌ **No dynamic text generation** - All text from language files only
- ❌ **No AI-generated translations** - Human translators only

### ✅ What We DO
- ✅ **Manual translations** - Every string professionally translated
- ✅ **Legal clarity** - Terms, policies, disclaimers reviewed per language
- ✅ **Cost control** - 15 languages = predictable translation budget
- ✅ **Trust building** - Users see authentic, culturally appropriate text

---

## Frontend Architecture

### Technology Stack
- **Web**: React + Vite (current)
- **Mobile**: React Native or Expo (future)
- **i18n Library**: Custom implementation (can migrate to i18next later)

### File Structure

```
/src
 ├─ /i18n
 │   ├─ index.ts          # Main i18n logic
 │   ├─ en.ts             # English translations (en-GB, en-IE)
 │   ├─ de.ts             # German translations (de-DE)
 │   ├─ fr.ts             # French translations (fr-FR)
 │   ├─ es.ts             # Spanish translations (es-ES)
 │   ├─ it.ts             # Italian translations (it-IT)
 │   ├─ sv.ts             # Swedish translations (sv-SE)
 │   ├─ no.ts             # Norwegian translations (nb-NO)
 │   ├─ dk.ts             # Danish translations (da-DK)
 │   ├─ fi.ts             # Finnish translations (fi-FI)
 │   ├─ nl.ts             # Dutch translations (nl-NL)
 │   ├─ pt.ts             # Portuguese translations (pt-PT)
 │   ├─ pl.ts             # Polish translations (pl-PL)
 │   ├─ ro.ts             # Romanian translations (ro-RO)
 │   └─ el.ts             # Greek translations (el-GR)
 │
 ├─ /data
 │   └─ languages.json    # Language metadata (name, flag, priority)
 │
 └─ /pages
     └─ LanguageSelection.tsx  # First-time language selection screen
```

### Translation File Structure

**Example: `src/i18n/en.ts`**
```typescript
export default {
  // Navigation
  nav: {
    home: 'Home',
    services: 'Services',
    bookings: 'My Bookings',
    profile: 'Profile',
  },

  // Common UI
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
  },

  // Home page
  home: {
    title: 'Help from trusted people near you',
    subtitle: 'Cleaning, moving, recycling and more',
    cta: 'Book now',
  },

  // Booking flow
  booking: {
    selectService: 'What do you need?',
    enterAddress: 'Where should it take place?',
    selectDate: 'When would you like the service?',
    confirmBooking: 'Review your booking',
    success: '✅ Booking confirmed!',
  },

  // Errors
  error: {
    payment: 'Payment failed. Please try again.',
    network: 'Network error. Check your connection.',
    notFound: 'Page not found',
  },

  // Chat
  chat: {
    greeting: 'Hi! 👋 How can I help you today?',
    quickReplies: {
      cleaning: '🏠 Home Cleaning',
      moving: '📦 Moving Help',
      recycling: '♻️ Recycling',
    },
  },
};
```

### Usage in Components

```typescript
import { t, getLocale } from '../i18n';

function MyComponent() {
  const locale = getLocale(); // 'en-GB', 'de-DE', etc.
  
  return (
    <div>
      <h1>{t('home.title', locale)}</h1>
      <p>{t('home.subtitle', locale)}</p>
      <button>{t('button.book', locale)}</button>
    </div>
  );
}
```

---

## Language Selection Flow

### 1. First Visit (New User)

**Behavior:**
1. Detect browser language (`navigator.language`)
2. Match to supported locale (e.g., `en` → `en-GB`, `de` → `de-DE`)
3. Show **Language Selection Screen** with detected language pre-selected
4. User confirms or changes language
5. Save to `localStorage` and user profile (if logged in)

**Example:**
```
Browser: de-CH (German, Switzerland)
→ Detect: de
→ Map to: de-DE (closest match)
→ Show: Language selection with de-DE highlighted
```

### 2. Returning User

**Behavior:**
1. Load language from `localStorage`
2. If user is logged in, sync with user profile
3. Apply language immediately (no selection screen)

### 3. Manual Change

**Behavior:**
1. User clicks language selector (in nav or settings)
2. Show modal or dropdown with all 15 languages
3. Update `localStorage` and user profile
4. Reload page or update UI dynamically

---

## Backend Architecture

### Database Schema

**User Profile:**
```typescript
{
  userId: string;
  preferredLanguage: 'en-GB' | 'de-DE' | 'fr-FR' | ... ; // One of 15 locales
  // ... other fields
}
```

**Translation Management (Future):**
```typescript
{
  translationId: string;
  key: string; // 'home.title'
  locale: string; // 'de-DE'
  value: string; // 'Hilfe von verifizierten Personen in Ihrer Nähe'
  lastUpdated: Date;
  reviewedBy: string; // Translator ID
  status: 'draft' | 'reviewed' | 'approved';
}
```

### API Responses

**Rule: Backend returns keys, frontend translates**

```json
// Backend response
{
  "error": {
    "code": "PAYMENT_FAILED",
    "messageKey": "error.payment"
  }
}

// Frontend displays
t('error.payment', locale) // "Payment failed. Please try again."
```

### Chat Engine (AI)

**Response Templates:**
```typescript
// backend/src/modules/chat/services/response-template.service.ts
const TEMPLATES = {
  greeting: {
    'en-GB': "Hi {name}! 👋 How can I help you today?",
    'de-DE': "Hallo {name}! 👋 Wie kann ich dir heute helfen?",
    'fr-FR': "Bonjour {name}! 👋 Comment puis-je vous aider?",
    // ... 15 languages
  },
  // ... more templates
};
```

---

## Translation Workflow

### Phase 1: English Base (Current)
1. Write all text in English (`en.ts`)
2. Build features with English text
3. Test UX and copywriting

### Phase 2: Core Languages (Next)
**Priority order:**
1. **German (de-DE)** - Major market (DE, AT, CH)
2. **French (fr-FR)** - Major market (FR, BE, CH)
3. **Spanish (es-ES)** - Large population
4. **Italian (it-IT)** - Major market (IT, CH)

**Process:**
1. Export English translations to spreadsheet
2. Send to professional translators
3. Review for cultural appropriateness
4. Import to `de.ts`, `fr.ts`, `es.ts`, `it.ts`
5. Test UI with new languages

### Phase 3: Nordic Languages
5. **Swedish (sv-SE)** - Major market (SE)
6. **Norwegian (nb-NO)** - Major market (NO)
7. **Danish (da-DK)** - Major market (DK)
8. **Finnish (fi-FI)** - Major market (FI)

### Phase 4: Other EU Languages
9. **Dutch (nl-NL)** - Major market (NL, BE)
10. **Portuguese (pt-PT)** - Market (PT)
11. **Polish (pl-PL)** - Large population
12. **Romanian (ro-RO)** - Growing market
13. **Greek (el-GR)** - Market (GR, CY)
14. **English (Ireland) (en-IE)** - Regional variant

---

## Legal & Compliance

### Terms of Service
- **Separate TOS per language** (not auto-translated)
- Reviewed by legal expert per jurisdiction
- Stored in `/legal/{locale}/terms.md`

### Privacy Policy
- **Separate policy per language**
- GDPR compliance (all EU languages)
- Stored in `/legal/{locale}/privacy.md`

### Consent Banners
- Cookie consent in user's language
- GDPR-compliant per locale

---

## Cost Management

### Translation Budget (Estimate)

**Assumptions:**
- 5,000 strings average across app
- Professional translation: €0.10/word
- Average string: 5 words
- Total words: 25,000

**Cost per language:**
```
25,000 words × €0.10 = €2,500 per language
```

**Total for 15 languages:**
```
€2,500 × 15 = €37,500 one-time cost
```

**Maintenance (per update):**
- New features: ~100 strings
- 100 strings × 5 words × €0.10 = €50 per language
- €50 × 15 = €750 per major update

### Cost Control Strategies:
1. ✅ **Fixed 15 languages** - No scope creep
2. ✅ **Batch translations** - Bundle updates quarterly
3. ✅ **Prioritize by usage** - Translate high-traffic pages first
4. ✅ **Reuse common strings** - "Save", "Cancel", "Confirm" shared

---

## Implementation Checklist

### ✅ Completed
- [x] Language selection screen (15 languages)
- [x] `languages.json` metadata file
- [x] Translation system (`src/i18n/index.ts`)
- [x] English translations (`en.ts`)
- [x] 14 additional language files (basic structure)
- [x] Locale detection logic
- [x] localStorage persistence

### 🔄 In Progress
- [ ] Complete translations for 14 languages (currently English-only)
- [ ] Update chat templates for 15 languages
- [ ] Backend API support for user language preference

### 📋 Pending
- [ ] Professional translation service integration
- [ ] Translation management system (TMS)
- [ ] Legal text translations (TOS, Privacy)
- [ ] Testing with native speakers per language
- [ ] SEO optimization per language (meta tags, URLs)
- [ ] Mobile app language support (React Native)

---

## Testing Strategy

### Manual Testing
1. **Language switcher**: Test all 15 languages load correctly
2. **Fallback**: Test missing keys show key name (not crash)
3. **RTL support**: Test Greek (LTR) vs Arabic (future RTL)
4. **Special characters**: Test ä, ö, ü, ß, é, ñ, etc.

### Automated Testing
```typescript
describe('i18n', () => {
  it('should load all 15 locales', () => {
    const locales = getSupportedLocales();
    expect(locales).toHaveLength(15);
  });

  it('should fallback to en-GB for missing keys', () => {
    expect(t('missing.key', 'de-DE')).toBe('missing.key');
  });

  it('should detect browser language', () => {
    // Mock navigator.language
    Object.defineProperty(navigator, 'language', { value: 'de-DE' });
    expect(detectLocale()).toBe('de-DE');
  });
});
```

---

## Future Enhancements

### Phase 1 (Current): Manual Files
- Translation files in TypeScript
- Simple `t()` function
- localStorage persistence

### Phase 2 (6 months): i18next Migration
- Migrate to `i18next` library
- Lazy loading (load only active language)
- Namespaces (split by feature)
- Pluralization support
- Date/time formatting per locale

### Phase 3 (12 months): Translation Management System
- Web-based TMS (e.g., Phrase, Locize)
- Translator portal (external translators can update directly)
- Version control (track changes per string)
- Missing translation alerts
- Automated quality checks

### Phase 4 (18 months): Dynamic Content Translation
- User-generated content (reviews, descriptions)
- Optional AI translation for UGC (with disclaimer)
- NOT for system UI (stays manual)

---

## Key Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **15 languages max** | Predictable cost, quality control |
| **No auto-translation** | Trust, legal clarity, brand consistency |
| **Manual translations only** | Human review, cultural appropriateness |
| **en-GB default (not en-US)** | EU-focused platform |
| **nb-NO (not no-NO)** | Correct ISO code for Norwegian Bokmål |
| **Shared en-GB/en-IE** | Minimal differences, cost savings |
| **TypeScript files (not JSON)** | Type safety, autocompletion, comments |

---

## Resources

### Translation Services
- **Professional**: Phrase, Locize, Smartling
- **Freelance**: ProZ, Gengo, Upwork
- **Community**: Crowdin (future, for open-source)

### Language Codes Reference
- ISO 639-1: Language code (en, de, fr)
- ISO 3166-1: Country code (GB, DE, FR)
- Combined: `en-GB`, `de-DE`, `fr-FR`

### Best Practices
1. **Keep strings short** - Easier to translate, cheaper
2. **Avoid concatenation** - "Hello" + name breaks in some languages
3. **Use placeholders** - `"Hi {name}!"` works in all languages
4. **Context matters** - "Book" (noun) vs "Book" (verb) = different translations
5. **Test with native speakers** - Always validate before launch

---

**Next Steps:**
1. ✅ Finalize English text (copywriting review)
2. 🔄 Translate to German, French, Spanish, Italian (core markets)
3. 📋 Add Nordic languages (Swedish, Norwegian, Danish, Finnish)
4. 📋 Complete remaining EU languages (Dutch, Portuguese, Polish, Romanian, Greek)
5. 📋 Legal text translations (TOS, Privacy, Cookie Policy)
6. 📋 Launch multilingual platform! 🚀
