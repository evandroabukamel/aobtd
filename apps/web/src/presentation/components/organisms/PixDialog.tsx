import { lazy, Suspense } from 'react';
import type { PixDetails } from '../../../domain/pix';
import { useI18n } from '../../../i18n/I18nContext';
import { PixMark } from '../atoms/PixMark';
import { CopyField } from '../molecules/CopyField';
import { FactList, type Fact } from '../molecules/FactList';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

const QrCode = lazy(() => import('../atoms/QrCode'));

/** "Pix" button that opens a dialog with the QR code, the recipient and the copy-and-paste code. */
export function PixDialog({ pix, className }: { pix: PixDetails; className?: string }) {
  const { t } = useI18n();
  const rows: [string, string | undefined][] = [
    [t.pixKey, pix.key],
    [t.pixName, pix.name],
    [t.pixReference, pix.reference],
  ];
  const facts: Fact[] = rows.flatMap(([term, value]) => (value ? [{ term, value: <span className="break-all">{value}</span> }] : []));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className} aria-label={t.pixTitle}>
          <PixMark />
          Pix
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t.close} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PixMark className="size-5" />
            {t.pixTitle}
          </DialogTitle>
          <DialogDescription>{t.pixDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-56 place-items-center">
          <Suspense fallback={<span className="text-sm text-muted-foreground">{t.loading}</span>}>
            <QrCode value={pix.code} label={t.pixQrCode} />
          </Suspense>
        </div>
        {facts.length > 0 && (
          <div className="[&_dt]:shrink-0">
            <FactList facts={facts} />
          </div>
        )}
        <CopyField label={t.pixCopyPaste} value={pix.code} copyLabel={t.copy} copiedLabel={t.copied} />
      </DialogContent>
    </Dialog>
  );
}
