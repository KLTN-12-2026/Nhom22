'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';

export function MobileNavigation({ groups, onLogout }) {
  const dialog = useRef(null);
  const pathname = usePathname();
  useEffect(() => {
    const closeOnDesktop = () => { if (window.innerWidth >= 1024) dialog.current?.close(); };
    window.addEventListener('resize', closeOnDesktop);
    return () => window.removeEventListener('resize', closeOnDesktop);
  }, []);
  useEffect(() => { dialog.current?.close(); }, [pathname]);
  return <>
    <button type="button" className="btn btn-quiet btn-icon app-menu-button" aria-label="Mở điều hướng" aria-haspopup="dialog" onClick={() => dialog.current.showModal()}><Icon name="menu" /></button>
    <dialog className="app-menu" ref={dialog} aria-labelledby="app-menu-title" onClick={event => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX > rect.right) dialog.current.close(); } }}>
      <div className="app-menu-head"><h2 id="app-menu-title">Điều hướng</h2><button type="button" className="btn btn-quiet btn-icon" aria-label="Đóng điều hướng" onClick={() => dialog.current.close()}>×</button></div>
      <nav aria-label="Điều hướng di động">{groups.map(group => <div className="nav-group" key={group.group}><p className="nav-group-title">{group.group}</p>{group.items.map(item => <Link key={item.key} className="nav-link" href={item.href} aria-current={(item.href==='/ca-nhan' ? pathname===item.href : pathname===item.href || pathname.startsWith(item.href+'/')) ? 'page' : undefined} onClick={() => dialog.current.close()}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</div>)}</nav>
      <button type="button" className="btn btn-secondary btn-block" onClick={() => { dialog.current.close(); onLogout(); }}><Icon name="logout" />Đăng xuất</button>
    </dialog>
  </>;
}
