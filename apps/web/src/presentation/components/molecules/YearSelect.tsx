interface Props {
  years: number[];
  value: number;
  label: string;
  onChange: (year: number) => void;
}

export function YearSelect({ years, value, label, onChange }: Props) {
  return (
    <>
      <label htmlFor="year">{label}</label>
      <select id="year" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </>
  );
}
