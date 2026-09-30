'use client';
import { useState } from 'react';

/**
 * Tabs — điều hướng theo tab với hỗ trợ bàn phím
 */
export function Tabs({ tabs = [], defaultTab, onChange, children }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  const handleChange = (id) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`tabs__tab${active === tab.id ? ' tabs__tab--active' : ''}`}
            onClick={() => handleChange(tab.id)}
            onKeyDown={(e) => {
              const idx = tabs.findIndex(t => t.id === tab.id);
              if (e.key === 'ArrowRight') handleChange(tabs[(idx + 1) % tabs.length].id);
              if (e.key === 'ArrowLeft')  handleChange(tabs[(idx - 1 + tabs.length) % tabs.length].id);
            }}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            {tab.label}
            {tab.badge != null && (
              <span style={{
                background: 'var(--color-primary-100)',
                color: 'var(--color-primary-700)',
                borderRadius: 'var(--radius-full)',
                padding: '0 6px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          className="tabs__panel"
          hidden={active !== tab.id}
        >
          {active === tab.id && children?.[tab.id]}
        </div>
      ))}
    </div>
  );
}
