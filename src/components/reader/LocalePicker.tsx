import { formatLocale } from "../../lib/format";

interface LocalePickerProps {
  locales: string[];
  current: string;
  onChange: (locale: string) => void;
  disabled?: boolean;
}

export function LocalePicker({ locales, current, onChange, disabled }: LocalePickerProps) {
  if (locales.length <= 1) return null;

  return (
    <label className="reader-toolbar__locale">
      <span className="reader-toolbar__locale-label" aria-hidden="true">
        🌐
      </span>
      <select
        className="reader-toolbar__locale-select"
        value={current}
        disabled={disabled}
        aria-label="Язык книги"
        onChange={(e) => onChange(e.target.value)}
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {formatLocale(loc)}
          </option>
        ))}
      </select>
    </label>
  );
}
