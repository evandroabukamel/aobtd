import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nContext';
import { findLocale, LOCALES } from '../../../i18n/locales';

/** Flag button with a dropdown of the supported languages, each shown in its own language. */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = findLocale(locale)!;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lang" ref={rootRef}>
      <button
        type="button"
        className="lang-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t.language}: ${current.name}`}
        title={t.language}
        onClick={() => setOpen((o) => !o)}
      >
        <img src={current.flag} alt="" width={24} height={18} />
        <span aria-hidden="true" className="lang-caret">▾</span>
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={t.language} className="lang-menu">
          {LOCALES.map((l) => (
            <li key={l.tag} role="option" aria-selected={l.tag === locale} lang={l.tag}>
              <button
                type="button"
                className={l.tag === locale ? 'active' : undefined}
                onClick={() => {
                  setLocale(l.tag);
                  setOpen(false);
                }}
              >
                <img src={l.flag} alt="" width={20} height={15} loading="lazy" />
                {l.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
