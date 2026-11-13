// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageSwitcher } from '../../src/presentation/components/molecules/LanguageSwitcher';
import { renderWithI18n } from './renderWithI18n';

describe('LanguageSwitcher', () => {
  it('names the current language on its button', () => {
    renderWithI18n(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'Language: English' })).toBeInTheDocument();
  });

  it('switches the page language from the menu', async () => {
    const { user } = renderWithI18n(<LanguageSwitcher />);
    await user.click(screen.getByRole('button', { name: 'Language: English' }));
    await user.click(screen.getByText('Deutsch'));
    expect(document.documentElement.lang).toBe('de');
    expect(screen.queryByText('Français')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /: Deutsch$/ })).toBeInTheDocument();
  });

  it('closes the menu with Escape without changing the language', async () => {
    const { user } = renderWithI18n(<LanguageSwitcher />);
    await user.click(screen.getByRole('button', { name: 'Language: English' }));
    expect(screen.getByText('Français')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Français')).not.toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
