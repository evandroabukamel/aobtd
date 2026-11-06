interface Props {
  years: number[];
  value: number;
  onChange: (year: number) => void;
}

export function YearSelect({ years, value, onChange }: Props) {
  return (
    <>
      <label htmlFor="year">Ano</label>
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
