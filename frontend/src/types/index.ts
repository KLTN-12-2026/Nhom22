// ============================================================
// AUTH & USER TYPES
// ============================================================

export type UserRole = "USER" | "ADMIN";

export type ProficiencyLevel = "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE" | "UPPER_INTERMEDIATE" | "ADVANCED";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  proficiencyLevel?: ProficiencyLevel;
  goals?: string[];
  favoriteTopics?: string[];
  dailyWordTarget?: number;
  dailyStudyMinutes?: number;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

// ============================================================
// FLASHCARD & DECK TYPES
// ============================================================

export type DeckSource = "LIBRARY_COMMUNICATION" | "LIBRARY_TOEIC" | "USER_CREATED" | "COPIED";
export type DeckVisibility = "PUBLIC" | "PRIVATE";
export type CardDifficulty = "EASY" | "MEDIUM" | "HARD";
export type WordType = "NOUN" | "VERB" | "ADJECTIVE" | "ADVERB" | "PHRASE" | "OTHER";

export interface Deck {
  id: string;
  name: string;
  description?: string;
  source: DeckSource;
  topic?: string;
  level?: ProficiencyLevel;
  visibility: DeckVisibility;
  cardCount: number;
  isFavorite: boolean;
  isOwner: boolean;
  ownerId: string;
  ownerName?: string;
  coverImageUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  deckId: string;
  word: string;
  wordType?: WordType;
  meaning: string;
  ipa?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  imageUrl?: string;
  audioUrl?: string;
  difficulty?: CardDifficulty;
  tags?: string[];
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// SRS / STUDY TYPES
// ============================================================

export type SRSRating = "FORGOT" | "HARD" | "REMEMBERED" | "EASY";
export type CardStatus = "NEW" | "LEARNING" | "DUE" | "OVERDUE" | "SUSPENDED";

export interface StudyCard extends Card {
  status: CardStatus;
  nextReviewAt?: string;
  reviewCount: number;
  forgetCount: number;
}

export interface StudySession {
  deckId: string;
  startedAt: string;
  endedAt?: string;
  totalCards: number;
  reviewedCards: number;
  correctCount: number;
  incorrectCount: number;
}

export interface StudyProgress {
  deckId: string;
  newCards: number;
  learningCards: number;
  dueCards: number;
  overdueCards: number;
  suspendedCards: number;
  masteredCards: number;
}

// ============================================================
// PRACTICE TYPES
// ============================================================

export type PracticeMode =
  | "CHOOSE_MEANING"
  | "CHOOSE_WORD"
  | "LISTEN_AND_WRITE"
  | "FILL_IN_BLANK"
  | "MATCH_WORDS"
  | "TYPE_WORD"
  | "COMPREHENSIVE_TEST";

export interface PracticeQuestion {
  id: string;
  cardId: string;
  mode: PracticeMode;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface PracticeResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

// ============================================================
// AI TYPES
// ============================================================

export type AITaskStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AITask {
  id: string;
  type: string;
  status: AITaskStatus;
  result?: unknown;
  error?: string;
  createdAt: string;
  completedAt?: string;
  quotaUsed: number;
}

export interface AIQuota {
  used: number;
  limit: number;
  resetsAt: string;
}

// ============================================================
// PRONUNCIATION TYPES
// ============================================================

export interface PronunciationRecord {
  id: string;
  cardId: string;
  word: string;
  audioUrl: string;
  score: number;
  feedback?: string;
  createdAt: string;
}

// ============================================================
// STATISTICS / PROGRESS TYPES
// ============================================================

export interface UserStats {
  totalWordsLearned: number;
  totalReviews: number;
  correctRate: number;
  totalStudyMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyGoalProgress: number;
}

export interface SkillStats {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

// ============================================================
// NOTIFICATION & GAMIFICATION
// ============================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  unlockedAt?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "DAILY" | "WEEKLY";
  target: number;
  progress: number;
  expiresAt: string;
  completed: boolean;
  xpReward: number;
}

// ============================================================
// ADMIN TYPES
// ============================================================

export type UserStatus = "ACTIVE" | "LOCKED";
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

export interface AdminUser extends User {
  status: UserStatus;
  lastLoginAt?: string;
  totalDecks: number;
  totalStudySessions: number;
}

export interface Report {
  id: string;
  type: "DECK" | "CARD" | "AI_OUTPUT";
  targetId: string;
  reason: string;
  status: ReportStatus;
  reportedBy: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
}

// ============================================================
// COMMON / PAGINATION
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export interface SelectOption {
  label: string;
  value: string;
}
