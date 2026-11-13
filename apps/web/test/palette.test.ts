import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The palette lives in styles.css as CSS variables. These tests read it the way the browser
 * does (every `--token: #hex` declared on :root, including inside media queries) and check
 * what a visitor experiences: a light page, and text that stays readable on its surface.
 */
const css = readFileSync(new URL('../src/presentation/styles.css', import.meta.url), 'utf8');

/** Each `:root { ... }` block is one theme; a media query can add another. */
const themes = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(([, body]) =>
  Object.fromEntries([...body!.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(([, k, v]) => [k!, v!])),
);

/** WCAG relative luminance and contrast ratio. */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** Text token on surface token, as the components pair them. */
const TEXT_PAIRS: [text: string, surface: string][] = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['primary-foreground', 'primary'],
  ['primary', 'card'], // links and the "report it" action
  ['foreground', 'primary-soft'], // pressed filters
  ['accent-foreground', 'accent'], // hovered items
  ['destructive', 'card'], // error alerts
  ['kind-government', 'card'],
  ['kind-database', 'card'],
];

describe('site palette', () => {
  it('declares the palette', () => {
    expect(themes.length).toBeGreaterThan(0);
    for (const theme of themes) expect(Object.keys(theme).length).toBeGreaterThan(10);
  });

  it('keeps the page light in every theme, whatever the system colour scheme', () => {
    expect(css).not.toMatch(/prefers-color-scheme:\s*dark/);
    // shadcn components carry `dark:` utilities; Tailwind fires them on a dark system unless
    // the variant is bound to a `.dark` class, which this site never sets.
    expect(css).toMatch(/@custom-variant dark \(&:where\(\.dark, \.dark \*\)\);/);
    for (const theme of themes) {
      expect(luminance(theme.background!)).toBeGreaterThan(0.9);
      expect(luminance(theme.card!)).toBeGreaterThan(0.9);
    }
  });

  it.each(TEXT_PAIRS)('keeps %s readable on %s (WCAG AA, 4.5:1)', (text, surface) => {
    for (const theme of themes) expect(contrast(theme[text]!, theme[surface]!)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the month bars visible against their track (3:1 for graphics)', () => {
    for (const theme of themes) expect(contrast(theme.primary!, theme.muted!)).toBeGreaterThanOrEqual(3);
  });
});
