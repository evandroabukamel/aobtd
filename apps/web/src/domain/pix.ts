/**
 * Pix "copy and paste" codes (BR Code, EMV QR format). The last field is `6304` + CRC16 of
 * everything before it, so a mistyped build variable is caught before it reaches the QR code.
 */
export interface PixDetails {
  /** Full copy-and-paste payload; the QR code encodes exactly this text. */
  code: string;
  key?: string;
  name?: string;
  /** Transfer identifier (txid) shown to the payer. */
  reference?: string;
}

/** CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over the UTF-8 bytes, as the BR Code spec requires. */
function crc16(text: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function isValidPixCode(code: string): boolean {
  const match = /^(000201.*6304)([0-9A-F]{4})$/i.exec(code);
  return !!match && crc16(match[1]!) === match[2]!.toUpperCase();
}
