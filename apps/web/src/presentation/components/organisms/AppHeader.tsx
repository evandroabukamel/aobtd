import { useI18n } from '../../../i18n/I18nContext';
import { LanguageSwitcher } from '../molecules/LanguageSwitcher';

export function AppHeader() {
  const { t } = useI18n();
  return (
    <header className="topbar">
      <div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
