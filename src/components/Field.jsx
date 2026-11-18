export default function Field({
  id,
  label,
  value,
  onChange,
  unit,
  placeholder,
  help,
  error,
  type = 'text',
  inputMode = 'numeric',
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field__row">
        <input
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || help ? `${id}-help` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="field__unit">{unit}</span>}
      </div>
      <p className="field__help" id={`${id}-help`} data-error={error ? 'true' : undefined}>
        {error || help || ''}
      </p>
    </div>
  );
}
