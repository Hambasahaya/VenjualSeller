/**
 * User Authentication & Profile Service
 * Handles: registration, login, email verification, password management, profile
 */

import {
  apiCall,
  clearAuthToken,
  clearMerchantId,
  clearPartnerId,
  clearUserId,
  createApiError,
  extractPartnerId,
  extractStoredMerchantId,
  getMerchantIdFromToken,
  getPartnerIdFromToken,
  getUserId,
  normalizeApiError,
  setAuthToken,
  setMerchantId,
  setPartnerId,
  setUserId,
} from "./api";

export interface User {
  id: number;
  partner_id?: string | number;
  username: string;
  email: string;
  phone?: string;
  full_name?: string;
  address?: string;
  city?: string;
  province?: string;
  avatar_url?: string;
  merchant_id?: string;
  merchant?: {
    id?: string;
    code?: string;
    name?: string;
  };
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  partner_id?: string | number;
  merchant_id?: string;
  merchant?: {
    id?: string;
    code?: string;
    name?: string;
  };
}

export interface AuthMessageResponse {
  message: string;
}

function syncMerchantId(source: unknown, token?: string): void {
  const merchantId =
    extractStoredMerchantId(source) ??
    getMerchantIdFromToken(token ?? null);

  if (merchantId) {
    setMerchantId(merchantId);
  }
}

function syncPartnerId(source: unknown, token?: string): void {
  const partnerId =
    extractPartnerId(source) ??
    getPartnerIdFromToken(token ?? null);

  if (partnerId) {
    setPartnerId(partnerId);
  }
}

function clearUserSession(): void {
  clearAuthToken();
  clearMerchantId();
  clearPartnerId();
  clearUserId();
}

export interface RequestVerificationEmailRequest {
  email: string;
}

export interface VerifyEmailTokenRequest {
  token: string;
}

export interface VerifyEmailRequest {
  verify_token: string;
}

export interface RequestPasswordResetEmailRequest {
  email: string;
}

export interface VerifyPasswordResetTokenRequest {
  email?: string;
  token?: string;
  verify_token?: string;
}

export interface PasswordResetTokenResponse extends AuthMessageResponse {
  verify_token?: string;
  reset_token?: string;
  token?: string;
  user_id?: number | string;
}

export interface ResetPasswordWithTokenRequest {
  email?: string;
  user_id?: number | string;
  verify_token: string;
  new_password: string;
  confirm_password?: string;
}

export interface UpdatePasswordRequest {
  old_pass?: string;
  new_pass?: string;
  old_password?: string;
  new_password?: string;
}

function ensureIntegerUserId(userId: number): number {
  if (!Number.isInteger(userId)) {
    throw createApiError(
      "validation_error",
      "user_id harus berupa integer.",
      422,
      [
        {
          field: "user_id",
          message: "user_id harus berupa integer.",
        },
      ]
    );
  }

  return userId;
}

function resolvePasswordValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function buildUpdatePasswordPayload(
  data: UpdatePasswordRequest
): {
  old_password: string;
  new_password: string;
} {
  const oldPass = resolvePasswordValue(data.old_pass ?? data.old_password);
  const newPass = resolvePasswordValue(data.new_pass ?? data.new_password);
  const details: Array<{ field: string; message: string }> = [];

  if (!oldPass.trim()) {
    details.push({
      field: "old_pass",
      message: "Password lama wajib diisi.",
    });
  }

  if (!newPass.trim()) {
    details.push({
      field: "new_pass",
      message: "Password baru wajib diisi.",
    });
  }

  if (details.length > 0) {
    throw createApiError(
      "validation_error",
      "Data password belum lengkap.",
      422,
      details
    );
  }

  return {
    old_password: oldPass,
    new_password: newPass,
 
  };
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterRequest): Promise<User> {
  return apiCall<User>("/api/v1/users/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Login user with email and password
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiCall<LoginResponse>("/api/v1/users/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Store auth token and user ID
  setUserId(response.user.id);
  clearMerchantId();
  clearPartnerId();

  if (response.token) {
    setAuthToken(response.token);
  } else {
    clearAuthToken();
  }

  syncMerchantId(response, response.token);
  syncMerchantId(response.user, response.token);
  syncPartnerId(response, response.token);
  syncPartnerId(response.user, response.token);

  return response;
}

/**
 * Request a new verification email for an unverified account
 */
export async function requestVerificationEmail(
  data: RequestVerificationEmailRequest
): Promise<AuthMessageResponse> {
  return apiCall<AuthMessageResponse>("/api/v1/users/request-verification-email", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Verify user email with verification token
 */
export async function verifyEmailToken(
  data: VerifyEmailTokenRequest
): Promise<AuthMessageResponse> {
  return apiCall<AuthMessageResponse>("/api/v1/users/verify-email-token", {
    method: "POST",
    body: JSON.stringify({
      token: data.token,
    }),
  });
}

/**
 * Backward-compatible alias for the deprecated verify-email flow.
 */
export async function verifyEmail(
  data: VerifyEmailRequest
): Promise<AuthMessageResponse> {
  return apiCall<AuthMessageResponse>("/api/v1/users/verify-email", {
    method: "POST",
    body: JSON.stringify({
      verify_token: data.verify_token,
    }),
  });
}

async function tryPostRequests<T>(
  attempts: Array<{
    endpoint: string;
    method?: "POST" | "PATCH";
    body: Record<string, unknown>;
  }>
): Promise<T> {
  let lastError = createApiError(
    "request_failed",
    "Permintaan tidak dapat diproses.",
    500
  );

  for (const attempt of attempts) {
    try {
      return await apiCall<T>(attempt.endpoint, {
        method: attempt.method ?? "POST",
        body: JSON.stringify(attempt.body),
      });
    } catch (error) {
      const apiError = normalizeApiError(error);
      lastError = apiError;

      const shouldTryNext =
        [400, 404, 405, 422].includes(apiError.status) ||
        apiError.code === "validation_error";

      if (!shouldTryNext) {
        throw apiError;
      }
    }
  }

  throw lastError;
}

export async function requestPasswordResetEmail(
  data: RequestPasswordResetEmailRequest
): Promise<AuthMessageResponse> {
  return requestVerificationEmail({
    email: data.email,
  });
}

export async function verifyPasswordResetToken(
  data: VerifyPasswordResetTokenRequest
): Promise<PasswordResetTokenResponse> {
  const resolvedToken = data.token?.trim() || data.verify_token?.trim();

  if (!resolvedToken) {
    throw createApiError(
      "validation_error",
      "Token verifikasi harus diisi.",
      422
    );
  }

  const normalizedEmail = data.email?.trim();
  const response = await tryPostRequests<PasswordResetTokenResponse>([
    {
      endpoint: "/api/v1/users/verify-email-token",
      method: "POST",
      body: {
        token: resolvedToken,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      },
    },
    {
      endpoint: "/api/v1/users/verify-email-token",
      method: "POST",
      body: {
        token: resolvedToken,
      },
    },
    {
      endpoint: "/api/v1/users/verify-email",
      method: "POST",
      body: {
        verify_token: resolvedToken,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      },
    },
  ]);

  return {
    ...response,
    token: response.token ?? resolvedToken,
    verify_token: response.verify_token ?? resolvedToken,
  };
}

export async function resetPasswordWithToken(
  data: ResetPasswordWithTokenRequest
): Promise<AuthMessageResponse> {
  const resolvedUserIdSource = data.user_id ?? getUserId();
  const resolvedUserId =
    resolvedUserIdSource !== undefined &&
    resolvedUserIdSource !== null &&
    String(resolvedUserIdSource).trim()
      ? String(resolvedUserIdSource).trim()
      : null;

  const passwordPatchEndpoint = resolvedUserId
    ? `/api/v1/users/${encodeURIComponent(resolvedUserId)}/password`
    : null;

  const attempts = [
    ...(passwordPatchEndpoint
      ? [
          {
            endpoint: passwordPatchEndpoint,
            method: "PATCH" as const,
            body: {
              old_password: data.verify_token,
              new_password: data.new_password,
            },
          },
          {
            endpoint: passwordPatchEndpoint,
            method: "PATCH" as const,
            body: {
              verify_token: data.verify_token,
              new_password: data.new_password,
            },
          },
          {
            endpoint: passwordPatchEndpoint,
            method: "PATCH" as const,
            body: {
              token: data.verify_token,
              password: data.new_password,
            },
          },
        ]
      : []),
    {
      endpoint: "/api/v1/users/reset-password",
      method: "POST" as const,
      body: {
        email: data.email,
        verify_token: data.verify_token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      },
    },
    {
      endpoint: "/api/v1/users/reset-password",
      method: "POST" as const,
      body: {
        email: data.email,
        token: data.verify_token,
        password: data.new_password,
        confirm_password: data.confirm_password,
      },
    },
    {
      endpoint: "/api/v1/users/forgot-password/reset",
      method: "POST" as const,
      body: {
        email: data.email,
        verify_token: data.verify_token,
        new_password: data.new_password,
      },
    },
    {
      endpoint: "/api/v1/users/update-password-with-token",
      method: "POST" as const,
      body: {
        email: data.email,
        token: data.verify_token,
        password: data.new_password,
      },
    },
  ];

  return tryPostRequests<AuthMessageResponse>(
    attempts.filter((attempt) =>
      Object.values(attempt.body).some(
        (value) => value !== undefined && value !== ""
      )
    )
  );
}

export async function logoutUser(userId?: number): Promise<void> {
  const resolvedUserId = userId ?? getUserId();

  try {
    if (resolvedUserId) {
      await apiCall<AuthMessageResponse>(`/api/v1/users/${resolvedUserId}/logout`, {
        method: "POST",
      });
    }
  } finally {
    clearUserSession();
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: number): Promise<User> {
  const user = await apiCall<User>(`/api/v1/users/${userId}`, {
    method: "GET",
  });

  syncMerchantId(user);
  syncPartnerId(user);

  return user;
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<User> {
  const userId = getUserId();
  if (!userId) {
    throw createApiError(
      "unauthorized",
      "Sesi login tidak ditemukan. Silakan login kembali.",
      401
    );
  }
  return getUserProfile(userId);
}

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  avatar_url?: string;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  data: UpdateUserRequest
): Promise<User> {
  const user = await apiCall<User>(`/api/v1/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  syncMerchantId(user);
  syncPartnerId(user);

  return user;
}

/**
 * Update current user profile
 */
export async function updateCurrentUserProfile(
  data: UpdateUserRequest
): Promise<User> {
  const userId = getUserId();
  if (!userId) {
    throw createApiError(
      "unauthorized",
      "Sesi login tidak ditemukan. Silakan login kembali.",
      401
    );
  }
  return updateUserProfile(userId, data);
}

/**
 * Change user password
 */
export async function updatePassword(
  userId: number,
  data: UpdatePasswordRequest
): Promise<{ message: string }> {
  const resolvedUserId = ensureIntegerUserId(userId);

  return apiCall<{ message: string }>(`/api/v1/users/${resolvedUserId}/password`, {
    method: "PATCH",
    body: JSON.stringify(buildUpdatePasswordPayload(data)),
  });
}

/**
 * Change current user password
 */
export async function updateCurrentPassword(
  data: UpdatePasswordRequest
): Promise<{ message: string }> {
  const userId = getUserId();
  if (!userId) {
    throw createApiError(
      "unauthorized",
      "Sesi login tidak ditemukan. Silakan login kembali.",
      401
    );
  }
  return updatePassword(userId, data);
}
