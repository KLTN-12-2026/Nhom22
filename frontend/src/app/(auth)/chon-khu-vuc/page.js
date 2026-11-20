'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useMe';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const learnHref = user => (user?.daHoanTatKhoiDau ? '/hom-nay' : '/bat-dau?next=%2Fhom-nay');

export default function ChooseAreaPage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useMe();
  const isAdmin = user?.vaiTro?.includes('ADMIN');

  useEffect(() => {
    if (isLoading) return;
    if (!user || error?.status === 401) router.replace('/dang-nhap');
    else if (!isAdmin) router.replace(learnHref(user));
  }, [user, isLoading, error, isAdmin, router]);

  if (isLoading || !isAdmin) return <div className="skeleton"><div className="sk sk-row" /></div>;

  return (
    <>
      <div className="auth-title">
        <h1>Chào {user.tenHienThi || 'quản trị viên'}</h1>
        <p>Tài khoản của bạn có quyền quản trị. Bạn muốn vào khu vực nào?</p>
      </div>
      <nav className={styles.choices} aria-label="Chọn khu vực">
        <Link href={learnHref(user)} className={styles.choice} data-tone="learn">
          <span className={styles.icon}><Icon name="today" /></span>
          <span className={styles.text}><b>Trang học</b><small>Ôn tập, bộ thẻ, luyện tập như người học.</small></span>
          <Icon name="chevron-right" />
        </Link>
        <Link href="/quan-tri" className={styles.choice} data-tone="admin">
          <span className={styles.icon}><Icon name="shield" /></span>
          <span className={styles.text}><b>Trang quản trị</b><small>Người dùng, nội dung, thanh toán, hệ thống.</small></span>
          <Icon name="chevron-right" />
        </Link>
      </nav>
      <p className="field-hint">Bạn có thể chuyển qua lại bất cứ lúc nào từ thanh điều hướng.</p>
    </>
  );
}
