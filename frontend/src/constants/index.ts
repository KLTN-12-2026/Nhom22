// ============================================================
// API
// ============================================================
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// ============================================================
// Pagination
// ============================================================
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================================
// SRS Ratings display
// ============================================================
export const SRS_RATING_LABELS = {
  FORGOT: "Quên",
  HARD: "Khó",
  REMEMBERED: "Nhớ",
  EASY: "Dễ",
} as const;

export const SRS_RATING_COLORS = {
  FORGOT: "text-red-500",
  HARD: "text-orange-500",
  REMEMBERED: "text-blue-500",
  EASY: "text-green-500",
} as const;

// ============================================================
// Card Status
// ============================================================
export const CARD_STATUS_LABELS = {
  NEW: "Mới",
  LEARNING: "Đang học",
  DUE: "Đến hạn",
  OVERDUE: "Quá hạn",
  SUSPENDED: "Tạm ngưng",
} as const;

// ============================================================
// Proficiency Levels
// ============================================================
export const LEVEL_LABELS = {
  BEGINNER: "Mới bắt đầu",
  ELEMENTARY: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  UPPER_INTERMEDIATE: "Trên trung cấp",
  ADVANCED: "Nâng cao",
} as const;

// ============================================================
// Practice Modes
// ============================================================
export const PRACTICE_MODE_LABELS = {
  CHOOSE_MEANING: "Chọn nghĩa",
  CHOOSE_WORD: "Chọn từ",
  LISTEN_AND_WRITE: "Nghe viết",
  FILL_IN_BLANK: "Điền chỗ trống",
  MATCH_WORDS: "Ghép từ",
  TYPE_WORD: "Nhập từ",
  COMPREHENSIVE_TEST: "Bài kiểm tra tổng hợp",
} as const;

// ============================================================
// Routes
// ============================================================
export const ROUTES = {
  // Visitor
  HOME: "/",
  PUBLIC_DECKS: "/decks",

  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_EMAIL: "/auth/verify-email",

  // User
  DASHBOARD: "/dashboard",
  MY_DECKS: "/decks",
  DECK_DETAIL: (id: string) => `/decks/${id}`,
  DECK_CARDS: (id: string) => `/decks/${id}/cards`,
  STUDY: (id: string) => `/study/${id}`,
  PRACTICE: "/practice",
  REVIEW: "/review",
  AI: "/ai",
  PRONUNCIATION: "/pronunciation",
  PROGRESS: "/progress",
  NOTEBOOK: "/notebook",
  SETTINGS: "/settings",

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_CONTENT: "/admin/content",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_NOTIFICATIONS: "/admin/notifications",
  ADMIN_SETTINGS: "/admin/settings",
} as const;
