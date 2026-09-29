import apiClient from "./axios";
import type { Deck, Card, PaginatedResponse, DeckVisibility } from "@/types";

// ============================================================
// DECK APIs
// ============================================================
export const deckApi = {
  /** Lấy danh sách thư viện công khai */
  getPublicDecks: (params?: {
    page?: number;
    pageSize?: number;
    topic?: string;
    level?: string;
    search?: string;
    sortBy?: string;
  }) => apiClient.get<PaginatedResponse<Deck>>("/decks/public", { params }),

  /** Lấy bộ thẻ của người dùng hiện tại */
  getMyDecks: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Deck>>("/decks/my", { params }),

  /** Lấy chi tiết một bộ thẻ */
  getDeck: (deckId: string) =>
    apiClient.get<Deck>(`/decks/${deckId}`),

  /** Tạo bộ thẻ mới */
  createDeck: (data: Partial<Deck>) =>
    apiClient.post<Deck>("/decks", data),

  /** Cập nhật bộ thẻ */
  updateDeck: (deckId: string, data: Partial<Deck>) =>
    apiClient.put<Deck>(`/decks/${deckId}`, data),

  /** Xoá bộ thẻ */
  deleteDeck: (deckId: string) =>
    apiClient.delete<{ message: string }>(`/decks/${deckId}`),

  /** Sao chép bộ thẻ công khai */
  copyDeck: (deckId: string) =>
    apiClient.post<Deck>(`/decks/${deckId}/copy`),

  /** Yêu thích / bỏ yêu thích */
  toggleFavorite: (deckId: string) =>
    apiClient.post<{ isFavorite: boolean }>(`/decks/${deckId}/favorite`),

  /** Cập nhật quyền hiển thị */
  updateVisibility: (deckId: string, visibility: DeckVisibility) =>
    apiClient.patch<Deck>(`/decks/${deckId}/visibility`, { visibility }),

  /** Báo cáo bộ thẻ */
  reportDeck: (deckId: string, reason: string) =>
    apiClient.post<{ message: string }>(`/decks/${deckId}/report`, { reason }),

  /** Chia sẻ liên kết */
  getShareLink: (deckId: string) =>
    apiClient.get<{ shareUrl: string }>(`/decks/${deckId}/share`),
};

// ============================================================
// CARD APIs
// ============================================================
export const cardApi = {
  /** Lấy danh sách thẻ trong bộ thẻ */
  getCards: (deckId: string, params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Card>>(`/decks/${deckId}/cards`, { params }),

  /** Tạo thẻ mới */
  createCard: (deckId: string, data: Partial<Card>) =>
    apiClient.post<Card>(`/decks/${deckId}/cards`, data),

  /** Cập nhật thẻ */
  updateCard: (deckId: string, cardId: string, data: Partial<Card>) =>
    apiClient.put<Card>(`/decks/${deckId}/cards/${cardId}`, data),

  /** Xoá thẻ */
  deleteCard: (deckId: string, cardId: string) =>
    apiClient.delete<{ message: string }>(`/decks/${deckId}/cards/${cardId}`),

  /** Nhập thẻ từ CSV */
  importCsv: (deckId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ imported: number; duplicates: number; preview: Card[] }>(
      `/decks/${deckId}/cards/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  /** Xuất thẻ ra CSV */
  exportCsv: (deckId: string) =>
    apiClient.get(`/decks/${deckId}/cards/export`, { responseType: "blob" }),

  /** Báo cáo thẻ */
  reportCard: (deckId: string, cardId: string, reason: string) =>
    apiClient.post<{ message: string }>(`/decks/${deckId}/cards/${cardId}/report`, { reason }),
};
