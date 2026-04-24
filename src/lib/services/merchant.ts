/**
 * Merchant Operations Service
 * Handles: balance, withdrawals, transaction history, summaries, WiFi settings
 */

import type { ApiError } from "./api";
import {
  apiCall,
  createApiError,
extractPartnerId,
  getAuthToken,
  getPartnerId,
  getPartnerIdFromToken,
  normalizeApiError,
  setPartnerId,
} from "./api";
import { getCurrentUserProfile } from "./user";

export interface MerchantBalance {
  merchant_id: string;
  merchant_name?: string;
  balance: number;
  available_balance?: number;
  pending_withdrawal?: number;
  currency: string;
  updated_at?: string;
}

export interface Withdrawal {
  id: string;
  merchant_id: string;
  amount: number;
  status: "pending" | "completed" | "failed" | string;
  reference?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_account_id?: string;
  notes?: string;
  currency?: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  amount: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_account_id?: string;
  reference?: string;
  notes?: string;
}

export interface GetWithdrawalsParams {
  limit?: number;
  offset?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface WithdrawalListResponse {
  data: Withdrawal[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface Transaction {
  id: string;
  order_id?: string;
  machine_type_code?: string;
  machine_name?: string;
  product_name?: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  paid_at?: string;
  created_at: string;
}

export interface TransactionSummary {
  merchant_id: string;
  total_transactions: number;
  total_amount: number;
  completed_transactions: number;
  completed_amount: number;
  pending_transactions: number;
  pending_amount: number;
  failed_transactions: number;
  failed_amount: number;
  average_transaction: number;
  period: string;
}

type TransactionSummaryResponse = Partial<TransactionSummary> & {
  total?: number;
  total_revenue?: number;
  amount?: number;
  revenue?: number;
  paid_transactions?: number;
  paid_amount?: number;
  transaction_count?: number;
  last_7_days?: {
    transaction_count?: number | string;
    amount?: number | string;
  };
  realtime?: {
    transaction_count?: number | string;
    amount?: number | string;
  };
  total_machine?: {
    transaction_count?: number | string;
    amount?: number | string;
  };
};

function toNumber(value: unknown, fallbackValue = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
  }

  return fallbackValue;
}

function normalizeTransactionSummary(
  summary: TransactionSummaryResponse | null | undefined
): TransactionSummary {
  const totalTransactions = toNumber(
    summary?.total_transactions ??
      summary?.transaction_count ??
      summary?.total_machine?.transaction_count ??
      summary?.last_7_days?.transaction_count
  );
  const totalAmount = toNumber(
    summary?.total_amount ??
      summary?.total_revenue ??
      summary?.amount ??
      summary?.revenue ??
      summary?.total ??
      summary?.total_machine?.amount ??
      summary?.last_7_days?.amount
  );
  const completedTransactions = toNumber(
    summary?.completed_transactions ??
      summary?.paid_transactions ??
      summary?.total_machine?.transaction_count ??
      summary?.last_7_days?.transaction_count
  );
  const completedAmount = toNumber(
    summary?.completed_amount ??
      summary?.paid_amount ??
      summary?.total_machine?.amount ??
      summary?.last_7_days?.amount
  );
  const pendingTransactions = toNumber(summary?.pending_transactions);
  const pendingAmount = toNumber(summary?.pending_amount);
  const failedTransactions = toNumber(summary?.failed_transactions);
  const failedAmount = toNumber(summary?.failed_amount);

  return {
    merchant_id: summary?.merchant_id ?? "",
    total_transactions: totalTransactions,
    total_amount: totalAmount,
    completed_transactions: completedTransactions,
    completed_amount: completedAmount,
    pending_transactions: pendingTransactions,
    pending_amount: pendingAmount,
    failed_transactions: failedTransactions,
    failed_amount: failedAmount,
    average_transaction:
      toNumber(summary?.average_transaction) ||
      (totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0),
    period: summary?.period ?? "",
  };
}

export interface WiFiSettingRequest {
  machine_id: string;
  wifi_ssid: string;
  wifi_password: string;
}

function addPartnerCandidates(
  candidates: string[],
  nextCandidates: string[]
): void {
  for (const candidate of nextCandidates) {
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }
}

async function getCurrentPartnerCandidates(): Promise<string[]> {
  const candidates: string[] = [];

  const storedPartnerId = getPartnerId();
  if (storedPartnerId) {
    candidates.push(storedPartnerId);
  }

  const tokenPartnerId = getPartnerIdFromToken(getAuthToken());
  if (tokenPartnerId) {
    addPartnerCandidates(candidates, [tokenPartnerId]);
  }

  try {
    const userProfile = await getCurrentUserProfile();
    const profilePartnerId = extractPartnerId(userProfile) ?? getPartnerId();
    if (profilePartnerId) {
      addPartnerCandidates(candidates, [profilePartnerId]);
    }
     
  } catch {
    // User profile is a best-effort source for merchant ID fallback.
  }

  return candidates;
}

function getMissingMerchantContextError() {
  return createApiError(
    "merchant_context_missing",
    "Data merchant belum tersedia. Silakan login ulang dengan akun yang terhubung ke merchant.",
    401
  );
}

function shouldTryNextMerchantCandidate(error: ApiError): boolean {
  return (
    [400, 401, 403, 404].includes(error.status) ||
    (error.status === 422 && error.code === "validation_error")
  );
}

async function withCurrentMerchant<T>(
  request: (merchantId: string) => Promise<T>
): Promise<T> {
  const candidates = await getCurrentPartnerCandidates();

  if (candidates.length === 0) {
    throw getMissingMerchantContextError();
  }

  let lastError = getMissingMerchantContextError();

  for (const candidate of candidates) {
    try {
      const response = await request(candidate);
      setPartnerId(candidate);
      return response;
    } catch (error) {
      const apiError = normalizeApiError(error);
      lastError = apiError;

      if (!shouldTryNextMerchantCandidate(apiError)) {
        throw apiError;
      }
    }
  }

  throw lastError;
}

/**
 * Get merchant balance
 */
export async function getMerchantBalance(
  merchantId: string
): Promise<MerchantBalance> {
  return apiCall<MerchantBalance>(
    `/api/v1/merchants/${merchantId}/balance`,
    {
      method: "GET",
    }
  );
}

/**
 * Get current merchant balance
 */
export async function getCurrentMerchantBalance(): Promise<MerchantBalance> {
  return withCurrentMerchant(getMerchantBalance);
}

/**
 * Request withdrawal from merchant balance
 */
export async function requestWithdrawal(
  merchantId: string,
  data: WithdrawalRequest
): Promise<Withdrawal> {
  return apiCall<Withdrawal>(
    `/api/v1/merchants/${merchantId}/withdrawals`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Request withdrawal from current merchant
 */
export async function requestCurrentWithdrawal(
  data: WithdrawalRequest
): Promise<Withdrawal> {
  return withCurrentMerchant((merchantId) => requestWithdrawal(merchantId, data));
}

type ApiWithdrawal = Partial<Withdrawal> & {
  id?: string | number;
  withdrawal_id?: string | number;
  amount?: string | number;
  nominal?: string | number;
  total_amount?: string | number;
  ref?: string;
  code?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankAccountId?: string;
  bank_account?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    id?: string;
  };
  bank?: {
    name?: string;
  };
  merchant?: {
    id?: string;
  };
};

type ApiWithdrawalListResponse =
  | ApiWithdrawal[]
  | {
      data?: ApiWithdrawal[];
      total?: number | string;
      limit?: number | string;
      offset?: number | string;
      pagination?: Partial<WithdrawalListResponse["pagination"]>;
    };

function normalizeWithdrawal(withdrawal: ApiWithdrawal): Withdrawal {
  return {
    id: String(withdrawal.id ?? withdrawal.withdrawal_id ?? ""),
    merchant_id: String(
      withdrawal.merchant_id ?? withdrawal.merchant?.id ?? ""
    ),
    amount: toNumber(
      withdrawal.amount ?? withdrawal.nominal ?? withdrawal.total_amount
    ),
    status: String(withdrawal.status ?? "pending"),
    reference: withdrawal.reference ?? withdrawal.ref ?? withdrawal.code,
    bank_name:
      withdrawal.bank_name ??
      withdrawal.bankName ??
      withdrawal.bank_account?.bank_name ??
      withdrawal.bank?.name,
    bank_account_number:
      withdrawal.bank_account_number ??
      withdrawal.bankAccountNumber ??
      withdrawal.bank_account?.account_number,
    bank_account_name:
      withdrawal.bank_account_name ??
      withdrawal.bankAccountName ??
      withdrawal.bank_account?.account_name,
    bank_account_id:
      withdrawal.bank_account_id ??
      withdrawal.bankAccountId ??
      withdrawal.bank_account?.id,
    notes: withdrawal.notes ?? withdrawal.note,
    currency: withdrawal.currency,
    created_at: withdrawal.created_at ?? withdrawal.createdAt ?? "",
    updated_at:
      withdrawal.updated_at ??
      withdrawal.updatedAt ??
      withdrawal.created_at ??
      withdrawal.createdAt ??
      "",
  };
}

function toWithdrawalList(
  response: ApiWithdrawalListResponse,
  params?: GetWithdrawalsParams
): WithdrawalListResponse {
  const list = Array.isArray(response) ? response : response.data ?? [];
  const pagination = Array.isArray(response) ? undefined : response.pagination;
  const total = Array.isArray(response) ? undefined : response.total;
  const limit = Array.isArray(response) ? undefined : response.limit;
  const offset = Array.isArray(response) ? undefined : response.offset;

  return {
    data: list.map(normalizeWithdrawal),
    pagination:
      pagination || total !== undefined || limit !== undefined || offset !== undefined
        ? {
            total: toNumber(pagination?.total ?? total, list.length),
            limit: toNumber(
              pagination?.limit ?? limit,
              params?.limit ?? list.length
            ),
            offset: toNumber(
              pagination?.offset ?? offset,
              params?.offset ?? 0
            ),
          }
        : undefined,
  };
}

/**
 * Get withdrawal history for a merchant
 */
export async function getMerchantWithdrawals(
  merchantId: string,
  params?: GetWithdrawalsParams
): Promise<WithdrawalListResponse> {
  return toWithdrawalList(
    await apiCall<ApiWithdrawalListResponse>(
      buildMerchantEndpoint(`/api/v1/merchants/${merchantId}/withdrawals`, params),
      {
        method: "GET",
      }
    ),
    params
  );
}

/**
 * Get withdrawal history for current merchant
 */
export async function getCurrentMerchantWithdrawals(
  params?: GetWithdrawalsParams
): Promise<WithdrawalListResponse> {
  return withCurrentMerchant((merchantId) =>
    getMerchantWithdrawals(merchantId, params)
  );
}

export interface GetHistoryParams {
  limit?: number;
  offset?: number;
  partner_id?: string | number;
  machine_id?: string | number;
  machine_type_code?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

function normalizeTransactionStatus(status: string): Transaction["status"] {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "paid" || normalizedStatus === "completed") {
    return "completed";
  }

  if (normalizedStatus === "pending") {
    return "pending";
  }

  return "failed";
}

function buildMerchantEndpoint(
  basePath: string,
  params?: GetHistoryParams
) {
  const queryParams = new URLSearchParams();

  if (params?.limit !== undefined) {
    queryParams.append("limit", String(params.limit));
  }

  if (params?.offset !== undefined) {
    queryParams.append("offset", String(params.offset));
  }

  if (params?.partner_id !== undefined && params.partner_id !== "") {
    queryParams.append("partner_id", String(params.partner_id));
  }

  if (params?.machine_id !== undefined && params.machine_id !== "") {
    queryParams.append("machine_id", String(params.machine_id));
  }

  if (params?.machine_type_code) {
    queryParams.append("machine_type_code", params.machine_type_code);
  }

  if (params?.status) {
    queryParams.append("status", params.status);
  }

  if (params?.date_from) {
    queryParams.append("date_from", params.date_from);
  }

  if (params?.date_to) {
    queryParams.append("date_to", params.date_to);
  }

  const query = queryParams.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

type ApiTransaction = Partial<Transaction> & {
  id?: string | number;
  aggregate_type?: string;
  aggregateType?: string;
  machine_type?: string;
  mechine_type?: string;
  mechine_type_code?: string;
  jenis_mesin?: string;
  amount?: string | number;
  total_amount?: string | number;
  paid_amount?: string | number;
  gross_amount?: string | number;
  transaction_amount?: string | number;
  payment_amount?: string | number;
  nominal?: string | number;
  price?: string | number;
  product_price?: string | number;
  quantity?: string | number;
  qty?: string | number;
  payment?: {
    amount?: string | number;
    total_amount?: string | number;
    gross_amount?: string | number;
  };
  payload?: {
    amount?: string | number;
    status?: string;
    currency?: string;
    aggregate_type?: string;
    aggregateType?: string;
    invoice_number?: string;
    transaction_id?: string;
    machine_type_code?: string;
    machine_type?: string;
    mechine_type_code?: string;
    mechine_type?: string;
  };
  product?: {
    price?: string | number;
    default_price?: string | number;
  };
  status?: string;
};

function toList<T>(response: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.data ?? [];
}

function isTransactionAggregate(transaction: ApiTransaction): boolean {
  const aggregateType =
    transaction.aggregate_type ??
    transaction.aggregateType ??
    transaction.payload?.aggregate_type ??
    transaction.payload?.aggregateType;

  if (!aggregateType) {
    return true;
  }

  return String(aggregateType).toUpperCase() === "TRANSACTION";
}

function normalizeMerchantTransaction(transaction: ApiTransaction): Transaction {
  const quantity = toNumber(transaction.quantity ?? transaction.qty) || 1;
  const productPrice = toNumber(
    transaction.product_price ??
      transaction.price ??
      transaction.product?.price ??
      transaction.product?.default_price
  );
  const amount =
    toNumber(
      transaction.amount ??
        transaction.total_amount ??
        transaction.paid_amount ??
        transaction.gross_amount ??
        transaction.transaction_amount ??
        transaction.payment_amount ??
        transaction.nominal ??
        transaction.payload?.amount ??
        transaction.payment?.amount ??
        transaction.payment?.total_amount ??
        transaction.payment?.gross_amount
    ) || productPrice * quantity;

  return {
    id: String(transaction.id),
    order_id:
      transaction.order_id ??
      transaction.payload?.invoice_number ??
      transaction.product_name ??
      transaction.machine_name ??
      transaction.payload?.transaction_id ??
      String(transaction.id),
    machine_type_code:
      transaction.machine_type_code ??
      transaction.mechine_type_code ??
      transaction.machine_type ??
      transaction.mechine_type ??
      transaction.jenis_mesin ??
      transaction.payload?.machine_type_code ??
      transaction.payload?.mechine_type_code ??
      transaction.payload?.machine_type ??
      transaction.payload?.mechine_type,
    machine_name: transaction.machine_name,
    product_name: transaction.product_name,
    amount,
    status: normalizeTransactionStatus(String(transaction.status ?? transaction.payload?.status)),
    paid_at: transaction.paid_at,
    created_at: transaction.created_at ?? "",
  };
}

/**
 * Get merchant transaction history
 */
export async function getMerchantHistory(
  merchantId: string,
  params?: GetHistoryParams
): Promise<Transaction[]> {
  const response = await apiCall<Transaction[] | { data?: Transaction[] }>(
    buildMerchantEndpoint(`/api/v1/merchants/${merchantId}/history`, params),
    { method: "GET" }
  );

  return toList(response)
    .filter((transaction) => isTransactionAggregate(transaction as ApiTransaction))
    .map(normalizeMerchantTransaction);
}

/**
 * Get current merchant transaction history
 */
export async function getCurrentMerchantHistory(
  params?: GetHistoryParams
): Promise<Transaction[]> {
  return withCurrentMerchant((merchantId) => getMerchantHistory(merchantId, params));
}

/**
 * Get merchant transaction summary
 */
export async function getMerchantTransactionSummary(
  merchantId: string,
  params?: Omit<GetHistoryParams, "merchant_id" | "limit" | "offset">
): Promise<TransactionSummary> {
  const summary = await apiCall<TransactionSummaryResponse>(
    buildMerchantEndpoint(
      `/api/v1/merchants/${merchantId}/transaction-summary`,
      params
    ),
    { method: "GET" }
  );

  return normalizeTransactionSummary({
    ...summary,
    merchant_id: summary?.merchant_id ?? merchantId,
    completed_transactions:
      summary?.completed_transactions ?? summary?.paid_transactions,
    completed_amount: summary?.completed_amount ?? summary?.paid_amount,
  });
}

/**
 * Get current merchant transaction summary
 */
export async function getCurrentMerchantTransactionSummary(
  params?: Omit<GetHistoryParams, "merchant_id" | "limit" | "offset">
): Promise<TransactionSummary> {
  return withCurrentMerchant((merchantId) =>
    getMerchantTransactionSummary(merchantId, params)
  );
}

/**
 * Withdrawal Event interface for history endpoint
 * Handles event-sourced withdrawal history from /api/v1/merchants/{id}/history
 */
export interface WithdrawalEventPayload {
  amount?: number;
  balance_after?: number;
  balance_before?: number;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  currency?: string;
  reference?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface WithdrawalEvent {
  id: string;
  aggregate_id?: string;
  aggregate_type?: string;
  event_type: string;
  correlation_id?: string;
  event_version?: number;
  payload?: WithdrawalEventPayload;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface WithdrawalHistoryMeta {
  count?: number;
  limit?: number;
  offset?: number;
  total?: number;
}

export interface WithdrawalHistoryResponse {
  data?: WithdrawalEvent[];
  meta?: WithdrawalHistoryMeta;
  pagination?: WithdrawalHistoryMeta;
  success?: boolean;
}

/**
 * Get withdrawal history for a merchant with filtering
 * Filters for WITHDRAWAL_REQUESTED events only
 */
export async function getMerchantWithdrawalHistory(
  merchantId: string,
  params?: Omit<GetHistoryParams, "merchant_id">
): Promise<WithdrawalListResponse> {
  const response = await apiCall<WithdrawalHistoryResponse | WithdrawalEvent[]>(
    buildMerchantEndpoint(`/api/v1/merchants/${merchantId}/history`, params),
    { method: "GET" },
    { unwrap: false }
  );
  const allData = toList<WithdrawalEvent>(response);

  // Filter data for withdrawal requests only
  const filteredData = allData
    .filter((event) => {
      const eventType = String(
        event.event_type ?? (event as { eventType?: unknown }).eventType ?? ""
      )
        .trim()
        .toUpperCase();
      const aggregateType = String(
        event.aggregate_type ??
          (event as { aggregateType?: unknown }).aggregateType ??
          event.payload?.aggregate_type ??
          (event.payload as { aggregateType?: unknown } | undefined)?.aggregateType ??
          ""
      )
        .trim()
        .toUpperCase();

      return eventType === "WITHDRAWAL_REQUESTED" && aggregateType === "WITHDRAWAL";
    })
    .map((event) => {
      const payload = event.payload || {};
      return normalizeWithdrawal({
        id: String(
          event.aggregate_id ??
            (event as { aggregateId?: unknown }).aggregateId ??
            event.id
        ),
        merchant_id: merchantId,
        amount: payload.amount,
        status: "pending",
        reference: payload.reference ?? event.correlation_id,
        bank_name: payload.bank_name,
        bank_account_number: payload.bank_account_number,
        bank_account_name: payload.bank_account_name,
        notes: payload.notes,
        currency: payload.currency || "IDR",
        created_at: event.created_at ?? "",
        updated_at: event.updated_at ?? event.created_at ?? "",
      });
    });

  // Map meta response structure to pagination
  const meta = Array.isArray(response) ? {} : response.meta || response.pagination || {};
  const pagination =
    meta.count !== undefined || meta.limit !== undefined || meta.offset !== undefined
      ? {
          total: toNumber(meta.count ?? meta.total, filteredData.length),
          limit: toNumber(meta.limit, params?.limit ?? filteredData.length),
          offset: toNumber(meta.offset, params?.offset ?? 0),
        }
      : undefined;

  const result = {
    data: filteredData,
    pagination,
  };

  return result;
}

/**
 * Get current merchant withdrawal history
 */
export async function getCurrentMerchantWithdrawalHistory(
  params?: Omit<GetHistoryParams, "merchant_id">
): Promise<WithdrawalListResponse> {
  return withCurrentMerchant((merchantId) =>
    getMerchantWithdrawalHistory(merchantId, params)
  );
}

/**
 * Update WiFi machine settings
 */
export async function updateWiFiSettings(
  merchantId: string,
  data: WiFiSettingRequest
): Promise<{ message: string }> {
  const response = await apiCall<{ message?: string }>(
    `/api/v1/merchants/${merchantId}/wifi-mechine-setting`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  return {
    message: response?.message ?? "Pengaturan WiFi berhasil diperbarui.",
  };
}

/**
 * Update WiFi settings for current merchant
 */
export async function updateCurrentWiFiSettings(
  data: WiFiSettingRequest
): Promise<{ message: string }> {
  return withCurrentMerchant((merchantId) => updateWiFiSettings(merchantId, data));
}
