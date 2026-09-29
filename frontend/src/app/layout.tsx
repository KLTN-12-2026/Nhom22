import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VocabMaster — Học từ vựng tiếng Anh thông minh",
    template: "%s | VocabMaster",
  },
  description:
    "Ứng dụng học từ vựng tiếng Anh với AI hỗ trợ, flashcard SRS, luyện phát âm và gamification.",
  keywords: ["học tiếng anh", "flashcard", "từ vựng", "TOEIC", "SRS", "AI"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
