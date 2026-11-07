import { useI18n } from '../../../i18n/I18nContext';
import { Logo } from '../atoms/Logo';
import { LanguageSwitcher } from '../molecules/LanguageSwitcher';

export function AppHeader() {
  const { t } = useI18n();
  return (
    <header className="topbar">
      <div className="brand">
        <Logo size={30} />
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
