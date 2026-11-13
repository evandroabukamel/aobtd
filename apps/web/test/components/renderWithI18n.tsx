import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nProvider } from '../../src/i18n/I18nContext';

/** Renders a component in English, the way the page does, and returns a user to drive it. */
export function renderWithI18n(ui: ReactElement) {
  const user = userEvent.setup();
  return { user, ...render(<I18nProvider initial="en">{ui}</I18nProvider>) };
}
