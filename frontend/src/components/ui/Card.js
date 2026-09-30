/**
 * Card — container với header, body, footer
 */
export function Card({ children, interactive = false, className = '', onClick, ...props }) {
  const Tag = interactive && onClick ? 'button' : 'div';
  return (
    <Tag
      className={['card', interactive && 'card--interactive', className].filter(Boolean).join(' ')}
      onClick={onClick}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card__header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`card__body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card__footer ${className}`}>{children}</div>;
}
