export function FieldError({ error, field }) {
  const message = error?.fieldErrors?.find(item => item.field === field)?.message;
  return message ? <p className="field-error" id={`${field}-error`} role="alert">{message}</p> : null;
}
