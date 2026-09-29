import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VocabMaster — Học từ vựng tiếng Anh thông minh",
  description:
    "Học từ vựng tiếng Anh hiệu quả với flashcard SRS, AI hỗ trợ, luyện phát âm và gamification.",
};

// TODO: Xây dựng Landing Page đầy đủ
export default function HomePage() {
  return (
    <main>
      <h1>Chào mừng đến với VocabMaster</h1>
      <p>Học từ vựng tiếng Anh thông minh hơn với AI</p>
    </main>
  );
}
