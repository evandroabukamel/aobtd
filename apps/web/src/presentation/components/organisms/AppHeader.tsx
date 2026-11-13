import { useI18n } from '../../../i18n/I18nContext';
import { LanguageSwitcher } from '../molecules/LanguageSwitcher';

export function AppHeader() {
  const { t } = useI18n();
  return (
    <header className="flex items-start justify-between gap-3 border-b-2 border-b-sky bg-card px-5 py-3 [grid-area:top]">
      <div>
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
