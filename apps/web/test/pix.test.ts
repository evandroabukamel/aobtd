import { describe, expect, it } from 'vitest';
import { isValidPixCode } from '../src/domain/pix';
import { readSiteLinks } from '../src/config/siteLinks';

const CODE =
  '00020126580014BR.GOV.BCB.PIX013612fb01a1-d76d-47f9-bd01-863088a736c45204000053039865802BR5917Evandro Abu Kamel6007Maringa62240520AircraftCrashMonitor6304D54E';

describe('Pix copy-and-paste code', () => {
  it('accepts a code whose CRC16 matches', () => {
    expect(isValidPixCode(CODE)).toBe(true);
  });

  it('rejects a mistyped or truncated code', () => {
    expect(isValidPixCode(CODE.replace('Maringa', 'Maringá'))).toBe(false);
    expect(isValidPixCode(CODE.slice(0, -1))).toBe(false);
    expect(isValidPixCode('')).toBe(false);
  });
});

describe('Pix site link', () => {
  it('is set only when the copy-and-paste code is valid', () => {
    const env = {
      VITE_PIX_CODE: ` ${CODE} `,
      VITE_PIX_KEY: '12fb01a1-d76d-47f9-bd01-863088a736c4',
      VITE_PIX_NAME: 'Evandro Abu Kamel',
      VITE_PIX_REFERENCE: 'AircraftCrashMonitor',
    } as ImportMetaEnv;
    expect(readSiteLinks(env).pix).toEqual({
      code: CODE,
      key: '12fb01a1-d76d-47f9-bd01-863088a736c4',
      name: 'Evandro Abu Kamel',
      reference: 'AircraftCrashMonitor',
    });
    expect(readSiteLinks({} as ImportMetaEnv).pix).toBeUndefined();
    expect(readSiteLinks({ VITE_PIX_CODE: 'garbage' } as ImportMetaEnv).pix).toBeUndefined();
  });
});
