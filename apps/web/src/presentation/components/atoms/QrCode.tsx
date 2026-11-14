import { QRCodeSVG } from 'qrcode.react';

/**
 * QR code drawn as SVG from the text it encodes. Default export so it can be lazy-loaded:
 * the encoder only downloads when a dialog that shows a QR code opens.
 */
export default function QrCode({ value, label }: { value: string; label: string }) {
  return (
    <QRCodeSVG
      value={value}
      size={224}
      marginSize={2}
      level="M"
      role="img"
      aria-label={label}
      className="h-auto w-full max-w-56 rounded-md bg-white"
    />
  );
}
