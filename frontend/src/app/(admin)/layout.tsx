// Admin group layout — protected pages (cần quyền ADMIN)
// TODO: Thêm AdminAuthGuard
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout flex min-h-screen">
      {/* TODO: Thêm Admin Sidebar */}
      <aside className="admin-sidebar">{/* Admin Sidebar */}</aside>
      <div className="flex-1 flex flex-col">
        {/* TODO: Thêm Admin Header */}
        <header className="admin-header">{/* Admin Header */}</header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
