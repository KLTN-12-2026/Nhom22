import apiClient from "./axios";
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types";

export const authApi = {
  /** Đăng nhập bằng email/mật khẩu */
  login: (data: LoginRequest) =>
    apiClient.post<AuthTokens & { user: User }>("/auth/login", data),

  /** Đăng nhập bằng Google OAuth */
  loginGoogle: (idToken: string) =>
    apiClient.post<AuthTokens & { user: User }>("/auth/google", { idToken }),

  /** Đăng ký tài khoản mới */
  register: (data: RegisterRequest) =>
    apiClient.post<{ message: string }>("/auth/register", data),

  /** Xác thực email bằng OTP/token */
  verifyEmail: (token: string) =>
    apiClient.post<{ message: string }>("/auth/verify-email", { token }),

  /** Gửi email đặt lại mật khẩu */
  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/auth/forgot-password", { email }),

  /** Đặt lại mật khẩu bằng token */
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>("/auth/reset-password", {
      token,
      newPassword,
    }),

  /** Đổi mật khẩu (đã đăng nhập) */
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<{ message: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
    }),

  /** Đăng xuất */
  logout: () => apiClient.post<{ message: string }>("/auth/logout"),

  /** Refresh access token */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>("/auth/refresh", { refreshToken }),
};
