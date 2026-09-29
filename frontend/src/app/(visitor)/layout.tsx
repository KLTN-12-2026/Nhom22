// Visitor group layout — public pages (không cần auth)
export default function VisitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="visitor-layout">
      {/* TODO: Thêm Navbar public */}
      <main>{children}</main>
      {/* TODO: Thêm Footer */}
    </div>
  );
}
