'use client';
import { forwardRef, useId } from 'react';

export const Checkbox = forwardRef(function Checkbox({ id, label, error, className = '', ...props }, ref) {
  const generatedId = useId();
  id = id || generatedId;
  return (
    <div className="field">
      <label className="checkbox-wrapper" htmlFor={id}>
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={['checkbox', className].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          {...props}
        />
        {label && <span className="checkbox-label">{label}</span>}
      </label>
      {error && <p role="alert" className="field__error" style={{ marginLeft: '1.5rem' }}>{error}</p>}
    </div>
  );
});
