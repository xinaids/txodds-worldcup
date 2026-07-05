import type { Locale } from '../i18n';

interface LocaleSwitcherProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const FLAGS: Record<Locale, string> = { en: '🇺🇸', pt: '🇧🇷', es: '🇪🇸' };
const LABELS: Record<Locale, string> = { en: 'EN', pt: 'PT', es: 'ES' };
const LOCALES: Locale[] = ['en', 'pt', 'es'];

export function LocaleSwitcher({ locale, setLocale }: LocaleSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
            locale === l
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span>{FLAGS[l]}</span>
          <span className="font-mono">{LABELS[l]}</span>
        </button>
      ))}
    </div>
  );
}
