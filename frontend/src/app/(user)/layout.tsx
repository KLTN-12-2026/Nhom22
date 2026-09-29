// User group layout — protected pages (cần đăng nhập)
// TODO: Thêm AuthGuard để kiểm tra token trước khi render
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="user-layout flex min-h-screen">
      {/* TODO: Thêm Sidebar navigation */}
      <aside className="sidebar">{/* Sidebar */}</aside>
      <div className="flex-1 flex flex-col">
        {/* TODO: Thêm Header / Topbar */}
        <header className="topbar">{/* Topbar */}</header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
