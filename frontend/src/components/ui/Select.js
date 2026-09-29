'use client';
import { forwardRef } from 'react';

export const Select = forwardRef(function Select({
  id, label, hint, error, required, options = [], placeholder, className = '', ...props
}, ref) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className={`field__label${required ? ' field__label--required' : ''}`}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={['select', error && 'select--error', className].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="field__error">{error}</p>}
    </div>
  );
});
