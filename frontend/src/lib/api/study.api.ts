import apiClient from "./axios";
import type { StudyCard, StudyProgress, StudySession, SRSRating } from "@/types";

export const studyApi = {
  /** Lấy thẻ cần học hôm nay */
  getTodayCards: (deckId: string) =>
    apiClient.get<StudyCard[]>(`/study/${deckId}/today`),

  /** Lấy tiến độ học của bộ thẻ */
  getProgress: (deckId: string) =>
    apiClient.get<StudyProgress>(`/study/${deckId}/progress`),

  /** Đánh giá thẻ sau khi học (SRS) */
  rateCard: (deckId: string, cardId: string, rating: SRSRating) =>
    apiClient.post<{ nextReviewAt: string }>(`/study/${deckId}/cards/${cardId}/rate`, {
      rating,
    }),

  /** Tạm ngưng thẻ */
  suspendCard: (deckId: string, cardId: string) =>
    apiClient.post<{ message: string }>(`/study/${deckId}/cards/${cardId}/suspend`),

  /** Khôi phục thẻ đã tạm ngưng */
  resumeCard: (deckId: string, cardId: string) =>
    apiClient.post<{ message: string }>(`/study/${deckId}/cards/${cardId}/resume`),

  /** Đặt lại tiến độ học */
  resetProgress: (deckId: string) =>
    apiClient.post<{ message: string }>(`/study/${deckId}/reset`),

  /** Ghi lại phiên học */
  saveSession: (session: Partial<StudySession>) =>
    apiClient.post<StudySession>("/study/sessions", session),

  /** Lấy lịch sử phiên học */
  getSessionHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<StudySession[]>("/study/sessions", { params }),
};
