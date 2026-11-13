import { describe, expect, it } from 'vitest';
import { createFormatters } from '../src/i18n/format';
import { en } from '../src/i18n/locales/en';
import { markerLabel, markerStyle, MARKER_COLORS } from '../src/presentation/components/organisms/crashMarker';

describe('crash marker style', () => {
  it('draws accidents without (known) fatalities as small orange dots', () => {
    for (const fatalities of [0, -1]) {
      const s = markerStyle(fatalities, false);
      expect(s.radius).toBe(6);
      expect(s.pathOptions.fillColor).toBe(MARKER_COLORS.nonFatal);
    }
  });

  it('grows fatal accidents with the square root of the toll, up to a cap', () => {
    expect(markerStyle(1, false).radius).toBe(8);
    expect(markerStyle(9, false).radius).toBe(12);
    expect(markerStyle(10_000, false).radius).toBe(18);
    expect(markerStyle(9, false).pathOptions.fillColor).toBe(MARKER_COLORS.fatal);
  });

  it('outlines the selected accident more strongly', () => {
    expect(markerStyle(0, true).pathOptions).toMatchObject({ color: MARKER_COLORS.selected, weight: 3 });
    expect(markerStyle(0, false).pathOptions).toMatchObject({ color: MARKER_COLORS.stroke, weight: 1 });
  });
});

describe('crash marker label', () => {
  const fmt = createFormatters('en');
  const time = Date.UTC(2026, 2, 2) / 1000;

  it('gives the date and the fatalities', () => {
    expect(markerLabel(en, fmt, 3, time)).toBe(`Mar 2, 2026 · ${en.fatalitiesTooltip(3)}`);
  });

  it('says when the fatalities are unknown', () => {
    expect(markerLabel(en, fmt, -1, time)).toBe(`Mar 2, 2026 · ${en.fatalitiesUnknown}`);
  });
});
