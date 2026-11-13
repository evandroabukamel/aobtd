import { ChevronDownIcon } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import { findLocale, LOCALES, type LocaleTag } from '../../../i18n/locales';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const Flag = ({ src, width }: { src: string; width: number }) => (
  <img src={src} alt="" width={width} height={(width * 3) / 4} className="block rounded-[2px] ring-1 ring-black/10" />
);

/**
 * Flag button with a menu of the supported languages, each shown in its own language.
 * Radix handles focus, arrow keys, Escape and outside clicks.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const current = findLocale(locale)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex-none gap-1 px-1.5" aria-label={`${t.language}: ${current.name}`} title={t.language}>
          <Flag src={current.flag} width={24} />
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>{t.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={(tag) => setLocale(tag as LocaleTag)}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.tag} value={l.tag} lang={l.tag} className="gap-2.5">
              <Flag src={l.flag} width={20} />
              {l.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
