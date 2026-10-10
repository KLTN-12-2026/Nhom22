'use client';
import { forwardRef, useId } from 'react';

export const Textarea = forwardRef(function Textarea({
  id, label, hint, error, required, rows = 4, className = '', ...props
}, ref) {
  const generatedId = useId();
  id = id || generatedId;
  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className={`field__label${required ? ' field__label--required' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        required={required}
        rows={rows}
        className={['textarea', error && 'textarea--error', className].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="field__error">{error}</p>}
    </div>
  );
});
