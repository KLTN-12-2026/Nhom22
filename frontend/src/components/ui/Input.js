'use client';
import { forwardRef } from 'react';

/**
 * Input — với label, hint, error message
 */
export const Input = forwardRef(function Input({
  id,
  label,
  hint,
  error,
  required,
  iconLeft,
  iconRight,
  className = '',
  ...props
}, ref) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className={`field__label${required ? ' field__label--required' : ''}`}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {iconLeft && <span className="input-icon" aria-hidden="true">{iconLeft}</span>}
        <input
          ref={ref}
          id={id}
          className={[
            'input',
            iconLeft && 'input--with-icon',
            error && 'input--error',
            className,
          ].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {iconRight && <span className="input-icon input-icon--right" aria-hidden="true">{iconRight}</span>}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="field__hint">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="field__error">{error}</p>}
    </div>
  );
});
