/**
 * API Configuration & Base Client
 * Base URL: https://api.venjual.id/
 */

const BASE_URL = "https://api.venjual.id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  request_id?: string;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
  status: number;
};

type MerchantLike = {
  id?: string | number;
  partner_id?: string | number;
  partnerId?: string | number;
  merchant_id?: string;
  merchantId?: string;
  merchant_code?: string;
  merchantCode?: string;
  username?: string;
  email?: string;
  merchant?: {
    id?: string;
    merchant_id?: string;
    code?: string;
  };
  merchants?: Array<{
    id?: string;
    merchant_id?: string;
    code?: string;
  }>;
};

type MerchantIdentifierOptions = {
  includeAccountAliases?: boolean;
};

type PartnerLike = {
  partner_id?: string | number;
  partnerId?: string | number;
  partner?: {
    id?: string | number;
    partner_id?: string | number;
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiError(value: unknown): value is ApiError {
  return (
    isObject(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    typeof value.status === "number"
  );
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    isObject(value) &&
    typeof (value as { success?: unknown }).success === "boolean"
  );
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Permintaan tidak valid.";
    case 401:
      return "Sesi Anda telah berakhir. Silakan login kembali.";
    case 403:
      return "Anda tidak memiliki akses ke data ini.";
    case 404:
      return "Data yang diminta tidak ditemukan.";
    case 422:
      return "Data yang dikirim belum valid.";
    case 500:
      return "Server sedang mengalami gangguan.";
    default:
      return "Terjadi kesalahan saat memproses permintaan.";
  }
}

function sanitizeBodySnippet(body: string): string | null {
  const snippet = body.replace(/\s+/g, " ").trim();
  return snippet ? snippet.slice(0, 160) : null;
}

function appendUniqueString(target: string[], value: unknown): void {
  if (typeof value !== "string") {
    return;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue || target.includes(normalizedValue)) {
    return;
  }

  target.push(normalizedValue);
}

function getEmailPrefix(email: string | undefined): string | null {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim();
  if (!normalizedEmail.includes("@")) {
    return null;
  }

  const prefix = normalizedEmail.split("@")[0]?.trim();
  return prefix || null;
}

export function createApiError(
  code: string,
  message: string,
  status = 500,
  details?: Array<{ field: string; message: string }>
): ApiError {
  return {
    code,
    message,
    details,
    status,
  };
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage = "Terjadi kesalahan. Silakan coba lagi."
): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return createApiError(
        "request_aborted",
        "Permintaan dibatalkan sebelum selesai.",
        499
      );
    }

    return createApiError(
      "network_error",
      error.message || fallbackMessage,
      0
    );
  }

  if (isObject(error)) {
    const details = Array.isArray(error.details)
      ? (error.details as Array<{ field: string; message: string }>)
      : undefined;

    return createApiError(
      typeof error.code === "string" ? error.code : "unknown_error",
      typeof error.message === "string" && error.message.trim()
        ? error.message
        : fallbackMessage,
      typeof error.status === "number" ? error.status : 500,
      details
    );
  }

  return createApiError("unknown_error", fallbackMessage, 500);
}

export function extractMerchantId(source: unknown): string | null {
  return extractMerchantIdentifiers(source)[0] ?? null;
}

export function extractStoredMerchantId(source: unknown): string | null {
  return (
    extractMerchantIdentifiers(source, { includeAccountAliases: false })[0] ??
    null
  );
}

export function extractPartnerId(source: unknown): string | null {
  if (!isObject(source)) {
    return null;
  }

  const partnerSource = source as PartnerLike;
  const partnerId =
    partnerSource.partner_id ??
    partnerSource.partnerId ??
    partnerSource.partner?.partner_id ??
    partnerSource.partner?.id;

  return partnerId !== undefined && partnerId !== null && String(partnerId).trim()
    ? String(partnerId)
    : null;
}

export function extractMerchantIdentifiers(
  source: unknown,
  options: MerchantIdentifierOptions = {}
): string[] {
  if (!isObject(source)) {
    return [];
  }

  const { includeAccountAliases = true } = options;
  const merchantSource = source as MerchantLike;
  const identifiers: string[] = [];

  appendUniqueString(identifiers, merchantSource.merchant_id);
  appendUniqueString(identifiers, merchantSource.merchantId);
  appendUniqueString(identifiers, merchantSource.merchant_code);
  appendUniqueString(identifiers, merchantSource.merchantCode);

  if (merchantSource.merchant) {
    appendUniqueString(identifiers, merchantSource.merchant.merchant_id);
    appendUniqueString(identifiers, merchantSource.merchant.id);
    appendUniqueString(identifiers, merchantSource.merchant.code);
  }

  if (Array.isArray(merchantSource.merchants)) {
    for (const merchant of merchantSource.merchants) {
      appendUniqueString(identifiers, merchant.merchant_id);
      appendUniqueString(identifiers, merchant.id);
      appendUniqueString(identifiers, merchant.code);
    }
  }

  if (includeAccountAliases) {
    // Some merchant endpoints accept merchant codes, and username/email prefix
    // are the only stable identifiers available from the current auth payload.
    appendUniqueString(identifiers, merchantSource.username);
    appendUniqueString(identifiers, getEmailPrefix(merchantSource.email));
  }

  return identifiers;
}

function decodeBase64Url(value: string): string | null {
  const atobFn = typeof globalThis.atob === "function" ? globalThis.atob : null;
  if (!atobFn) {
    return null;
  }

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atobFn(padded);
    const percentEncoded = Array.from(binary, (char) =>
      `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
    ).join("");

    return decodeURIComponent(percentEncoded);
  } catch {
    return null;
  }
}

export function getMerchantIdFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payloadSegment);
  if (!decodedPayload) {
    return null;
  }

  try {
    return extractStoredMerchantId(JSON.parse(decodedPayload));
  } catch {
    return null;
  }
}

export function getPartnerIdFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payloadSegment);
  if (!decodedPayload) {
    return null;
  }

  try {
    return extractPartnerId(JSON.parse(decodedPayload));
  } catch {
    return null;
  }
}

/**
 * Make API request with automatic error handling
 */
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  config?: { unwrap?: boolean }
): Promise<T> {
  const unwrap = config?.unwrap ?? true;
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options?.headers);
  const token = getAuthToken();

  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw normalizeApiError(
      error,
      "Tidak dapat terhubung ke server Venjual. Periksa koneksi Anda lalu coba lagi."
    );
  }

  const rawBody = await response.text();
  let data: unknown = undefined;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody) as unknown;
    } catch {
      const responseMessage =
        sanitizeBodySnippet(rawBody) || "Server mengirim respons yang tidak valid.";

      throw createApiError("invalid_response", responseMessage, response.status);
    }
  }

  if (isApiResponse<unknown>(data)) {
    if (!response.ok || !data.success) {
      throw createApiError(
        data.error?.code || `http_${response.status}`,
        data.error?.message ||
          data.message ||
          getDefaultErrorMessage(response.status),
        response.status,
        data.error?.details
      );
    }

    if (!unwrap) {
      return data as T;
    }

    return data.data as T;
  }

  if (!response.ok) {
    const errorData = isObject(data) ? data : {};

    throw createApiError(
      (isObject(errorData.error) && typeof errorData.error.code === "string"
        ? errorData.error.code
        : undefined) || `http_${response.status}`,
      (isObject(errorData.error) && typeof errorData.error.message === "string"
        ? errorData.error.message
        : undefined) ||
        (typeof errorData.message === "string" ? errorData.message : undefined) ||
        getDefaultErrorMessage(response.status),
      response.status,
      isObject(errorData.error) && Array.isArray(errorData.error.details)
        ? (errorData.error.details as Array<{ field: string; message: string }>)
        : undefined
    );
  }

  return data as T;
}

export async function healthCheck(): Promise<unknown> {
  return apiCall<unknown>("/health", { method: "GET" });
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookieName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(cookieName));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice(cookieName.length);
  return value ? decodeURIComponent(value) : null;
}

function setCookieValue(
  name: string,
  value: string,
  maxAge = COOKIE_MAX_AGE
): void {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ].join("; ");
}

function clearCookieValue(name: string): void {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${encodeURIComponent(name)}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
  ].join("; ");
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const storedToken = localStorage.getItem("auth_token");
  if (storedToken) {
    return storedToken;
  }

  const cookieToken = getCookieValue("auth_token");
  if (cookieToken) {
    localStorage.setItem("auth_token", cookieToken);
  }

  return cookieToken;
}

/**
 * Set auth token to localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
  setCookieValue("auth_token", token);
}

/**
 * Clear auth token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  clearCookieValue("auth_token");
}

/**
 * Get user ID from localStorage
 */
export function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  const storedId = localStorage.getItem("user_id");
  const id = storedId || getCookieValue("user_id");

  if (!storedId && id) {
    localStorage.setItem("user_id", id);
  }

  return id ? parseInt(id, 10) : null;
}

/**
 * Set user ID to localStorage
 */
export function setUserId(id: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user_id", id.toString());
  setCookieValue("user_id", id.toString());
}

/**
 * Get merchant ID from localStorage
 */
export function getMerchantId(): string | null {
  if (typeof window === "undefined") return null;
  const storedMerchantId = localStorage.getItem("merchant_id");
  if (storedMerchantId) {
    return storedMerchantId;
  }

  const cookieMerchantId = getCookieValue("merchant_id");
  if (cookieMerchantId) {
    localStorage.setItem("merchant_id", cookieMerchantId);
  }

  return cookieMerchantId;
}

/**
 * Get partner ID from localStorage
 */
export function getPartnerId(): string | null {
  if (typeof window === "undefined") return null;
  const storedPartnerId = localStorage.getItem("partner_id");
  if (storedPartnerId) {
    return storedPartnerId;
  }

  const cookiePartnerId = getCookieValue("partner_id");
  if (cookiePartnerId) {
    localStorage.setItem("partner_id", cookiePartnerId);
  }

  return cookiePartnerId;
}

/**
 * Set merchant ID to localStorage
 */
export function setMerchantId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("merchant_id", id);
  setCookieValue("merchant_id", id);
}

/**
 * Set partner ID to localStorage
 */
export function setPartnerId(id: string | number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("partner_id", String(id));
  setCookieValue("partner_id", String(id));
}

/**
 * Clear merchant ID from localStorage
 */
export function clearMerchantId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("merchant_id");
  clearCookieValue("merchant_id");
}

/**
 * Clear partner ID from localStorage
 */
export function clearPartnerId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("partner_id");
  clearCookieValue("partner_id");
}

/**
 * Clear user ID from localStorage
 */
export function clearUserId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user_id");
  clearCookieValue("user_id");
}
