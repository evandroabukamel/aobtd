import { CheckIcon, CopyIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface Props {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
}

/** Read-only value in a disabled text field, with a button that copies it to the clipboard. */
export function CopyField({ label, value, copyLabel, copiedLabel }: Props) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () =>
    navigator.clipboard.writeText(value).then(
      () => setCopied(true),
      () => setCopied(false),
    );

  return (
    <div className="grid gap-1.5 text-sm">
      <label htmlFor={id} className="text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <Input id={id} value={value} disabled className="font-mono text-xs" />
        <Button type="button" variant="outline" onClick={copy} aria-live="polite">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
    </div>
  );
}
