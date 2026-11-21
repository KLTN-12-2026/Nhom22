export function AdminPageHead({ title, description, meta, actions }) {
  return (
    <div className="adm-head">
      <div>
        <h1>{title}{meta != null && <span className="adm-head-meta">{meta}</span>}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="adm-head-actions">{actions}</div>}
    </div>
  );
}

export function Pill({ tone = 'mute', children, title }) {
  return <span className={`adm-pill adm-pill-${tone}`} title={title}>{children}</span>;
}

export function Who({ name, sub, initials, href, LinkComponent }) {
  const text = initials || (name || sub || '?').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();
  const body = <><span className="adm-avatar-sm" aria-hidden="true">{text}</span><span className="adm-who-text"><b>{name}</b>{sub && <small>{sub}</small>}</span></>;
  if (href && LinkComponent) return <LinkComponent href={href} className="adm-who">{body}</LinkComponent>;
  return <span className="adm-who">{body}</span>;
}
