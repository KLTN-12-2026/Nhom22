'use client';
import { useState } from 'react';
import {
  Button, Input, Select, Checkbox, Textarea, Card, CardHeader, CardBody, CardFooter,
  Modal, Drawer, Tabs, Badge, Skeleton, SkeletonText, SkeletonCard,
  EmptyState, ErrorState, Pagination, ConfirmDialog, ToastProvider, useToast
} from '@/components/ui';

/* ===== SECTION WRAPPER ===== */
function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 'var(--space-12)' }}>
      <h2 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        borderBottom: '2px solid var(--color-primary-200)',
        paddingBottom: 'var(--space-2)',
        marginBottom: 'var(--space-6)',
        color: 'var(--color-primary-700)',
      }}>{title}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <Section title="Toast">
      <Button onClick={() => toast('Thao tác thành công!', { variant: 'success', title: 'Thành công' })}>Success Toast</Button>
      <Button variant="secondary" onClick={() => toast('Có cảnh báo cần chú ý', { variant: 'warning', title: 'Cảnh báo' })}>Warning Toast</Button>
      <Button variant="danger" onClick={() => toast('Đã xảy ra lỗi', { variant: 'error', title: 'Lỗi' })}>Error Toast</Button>
      <Button variant="ghost" onClick={() => toast('Thông báo thông thường')}>Default Toast</Button>
    </Section>
  );
}

export default function UIKitPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <ToastProvider>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-4)',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-12)', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)' }}>
            🎨 VocabFlow UI Kit
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Design System — F0.2 Showcase · Tất cả thành phần UI
          </p>
        </div>

        {/* BUTTON */}
        <Section title="Button">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" loading>Loading...</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </Section>

        {/* BADGE */}
        <Section title="Badge">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success" dot>Thành công</Badge>
          <Badge variant="warning" dot>Cảnh báo</Badge>
          <Badge variant="error" dot>Lỗi</Badge>
        </Section>

        {/* INPUT */}
        <Section title="Input, Select, Checkbox, Textarea">
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 'var(--space-4)' }}>
            <Input id="email" label="Email" placeholder="example@email.com" type="email" required />
            <Input id="err-input" label="Input lỗi" placeholder="Nhập dữ liệu..." error="Trường này là bắt buộc" />
            <Select
              id="level"
              label="Trình độ"
              placeholder="-- Chọn trình độ --"
              options={[
                { value: 'beginner', label: 'Sơ cấp' },
                { value: 'intermediate', label: 'Trung cấp' },
                { value: 'advanced', label: 'Nâng cao' },
              ]}
            />
            <Checkbox id="agree" label="Tôi đồng ý với điều khoản sử dụng" />
            <Textarea id="desc" label="Mô tả" placeholder="Nhập mô tả..." rows={3} />
          </div>
        </Section>

        {/* CARD */}
        <Section title="Card">
          <Card style={{ width: 240 }}>
            <CardHeader><strong>Tiêu đề thẻ</strong></CardHeader>
            <CardBody>Nội dung bên trong card với padding đầy đủ.</CardBody>
            <CardFooter><Button size="sm" variant="secondary">Xem thêm</Button></CardFooter>
          </Card>
          <Card interactive style={{ width: 200 }} onClick={() => alert('Click!')}>
            <CardBody>Card có thể click — hover để thấy hiệu ứng.</CardBody>
          </Card>
        </Section>

        {/* SKELETON */}
        <Section title="Skeleton">
          <div style={{ width: 260 }}>
            <SkeletonCard />
          </div>
          <div style={{ width: 260 }}>
            <SkeletonText lines={4} />
          </div>
          <Skeleton width={80} height={80} style={{ borderRadius: '50%' }} />
        </Section>

        {/* TABS */}
        <Section title="Tabs">
          <div style={{ width: '100%' }}>
            <Tabs
              tabs={[
                { id: 'all', label: 'Tất cả', badge: 12 },
                { id: 'new', label: 'Từ mới', badge: 4 },
                { id: 'due', label: 'Đến hạn ôn' },
              ]}
            >
              {{
                all: <p>Nội dung tab Tất cả.</p>,
                new: <p>Nội dung tab Từ mới.</p>,
                due: <p>Nội dung tab Đến hạn ôn.</p>,
              }}
            </Tabs>
          </div>
        </Section>

        {/* PAGINATION */}
        <Section title="Pagination">
          <Pagination page={page} totalPages={10} onPageChange={setPage} />
        </Section>

        {/* EMPTY STATE & ERROR STATE */}
        <Section title="EmptyState & ErrorState">
          <div style={{ flex: 1, minWidth: 280, border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <EmptyState
              title="Chưa có từ vựng nào"
              description="Bắt đầu bằng cách tạo hoặc nhập bộ từ vựng."
              action={{ label: 'Tạo bộ từ vựng', onClick: () => {} }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 280, border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <ErrorState
              title="Không tải được dữ liệu"
              description="Kiểm tra kết nối mạng và thử lại."
              onRetry={() => alert('Đang thử lại...')}
            />
          </div>
        </Section>

        {/* MODAL, DRAWER, CONFIRM */}
        <Section title="Modal, Drawer, ConfirmDialog">
          <Button onClick={() => setModalOpen(true)}>Mở Modal</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Mở Drawer</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Xác nhận xoá</Button>
        </Section>

        <ToastDemo />

        {/* ===== OVERLAYS ===== */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Tạo bộ từ vựng mới"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
              <Button onClick={() => setModalOpen(false)}>Lưu</Button>
            </>
          }
        >
          <Input id="modal-name" label="Tên bộ từ vựng" placeholder="Ví dụ: IELTS Band 7" />
        </Modal>

        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Bộ lọc">
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Drawer từ bên phải màn hình.</p>
          <Select
            id="drawer-topic"
            label="Chủ đề"
            placeholder="-- Tất cả --"
            options={[
              { value: 'business', label: 'Kinh doanh' },
              { value: 'travel', label: 'Du lịch' },
            ]}
          />
        </Drawer>

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); alert('Đã xóa!'); }}
          title="Xoá bộ từ vựng?"
          description="Toàn bộ thẻ và tiến trình học sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác."
          confirmLabel="Xoá"
        />
      </div>
    </ToastProvider>
  );
}
