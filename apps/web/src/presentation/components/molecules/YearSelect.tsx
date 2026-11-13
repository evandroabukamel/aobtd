import { useId } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Props {
  years: number[];
  value: number;
  label: string;
  onChange: (year: number) => void;
}

export function YearSelect({ years, value, label, onChange }: Props) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id={id} size="sm" className="w-24 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
