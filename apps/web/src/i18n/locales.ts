import cn from 'flag-icons/flags/4x3/cn.svg';
import de from 'flag-icons/flags/4x3/de.svg';
import fr from 'flag-icons/flags/4x3/fr.svg';
import gb from 'flag-icons/flags/4x3/gb.svg';
import jp from 'flag-icons/flags/4x3/jp.svg';
import br from 'flag-icons/flags/4x3/br.svg';
import pt from 'flag-icons/flags/4x3/pt.svg';
import ruFlag from 'flag-icons/flags/4x3/ru.svg';
import ua from 'flag-icons/flags/4x3/ua.svg';
// The flag-icons Spanish flag carries the full coat of arms (~80 KB); this one is a light version.
import esFlag from './flags/es.svg';
import { de as deMessages } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr as frMessages } from './locales/fr';
import { ja } from './locales/ja';
import { ptBR } from './locales/pt-BR';
import { ptPT } from './locales/pt-PT';
import { ru } from './locales/ru';
import { uk } from './locales/uk';
import { zhCN } from './locales/zh-CN';
import type { Messages } from './messages';

export interface Locale {
  /** BCP 47 tag, also used by Intl for dates, months and numbers. */
  tag: string;
  /** Language name written in that language. */
  name: string;
  flag: string;
  messages: Messages;
}

export const LOCALES = [
  { tag: 'pt-BR', name: 'Português (Brasil)', flag: br, messages: ptBR },
  { tag: 'pt-PT', name: 'Português (Portugal)', flag: pt, messages: ptPT },
  { tag: 'en', name: 'English', flag: gb, messages: en },
  { tag: 'es', name: 'Español', flag: esFlag, messages: es },
  { tag: 'de', name: 'Deutsch', flag: de, messages: deMessages },
  { tag: 'fr', name: 'Français', flag: fr, messages: frMessages },
  { tag: 'zh-CN', name: '简体中文', flag: cn, messages: zhCN },
  { tag: 'ja', name: '日本語', flag: jp, messages: ja },
  { tag: 'ru', name: 'Русский', flag: ruFlag, messages: ru },
  { tag: 'uk', name: 'Українська', flag: ua, messages: uk },
] as const satisfies readonly Locale[];

export type LocaleTag = (typeof LOCALES)[number]['tag'];

export const DEFAULT_LOCALE: LocaleTag = 'en';

export const findLocale = (tag: string): Locale | undefined => LOCALES.find((l) => l.tag === tag);

/**
 * Picks the best supported locale for the browser's preferred languages: an exact
 * match first ("pt-PT"), then the same language ("pt-AO" -> first "pt-*", "zh-TW" -> "zh-CN").
 */
export function matchLocale(preferred: readonly string[]): LocaleTag {
  for (const wanted of preferred) {
    const exact = LOCALES.find((l) => l.tag.toLowerCase() === wanted.toLowerCase());
    if (exact) return exact.tag;
    const lang = wanted.split('-')[0]!.toLowerCase();
    const sameLanguage = LOCALES.find((l) => l.tag.split('-')[0]!.toLowerCase() === lang);
    if (sameLanguage) return sameLanguage.tag;
  }
  return DEFAULT_LOCALE;
}
