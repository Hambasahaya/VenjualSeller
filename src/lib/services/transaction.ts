/**
 * Transaction Service
 * Handles: transaction listing and realtime transaction summaries.
 */

import { apiCall, getPartnerId } from "./api";

export type TransactionStatus =
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "completed"
  | "pending"
  | "failed"
  | string;

export interface Transaction {
  id: string;
  order_id?: string;
  partner_id?: string | number;
  merchant_id?: string;
  machine_id?: string | number;
  machine_type_code?: string;
  machine_name?: string;
  product_name?: string;
  amount: number;
  currency?: string;
  status: TransactionStatus;
  paid_at?: string;
  created_at: string;
}

export interface GetTransactionsParams {
  partner_id?: string | number;
  merchant_id?: string;
  machine_id?: string | number;
  machine_type_code?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface RealtimeTransactionSummary {
  partner_id?: string | number;
  merchant_id?: string;
  machine_type_code?: string;
  machine_id?: string | number;
  total_transactions: number;
  total_amount: number;
  paid_transactions: number;
  paid_amount: number;
  pending_transactions: number;
  pending_amount: number;
  failed_transactions: number;
  failed_amount: number;
  average_transaction: number;
  period?: string;
  items?: Transaction[];
  by_machine_type?: Array<{
    machine_type_code?: string;
    total_transactions?: number;
    total_amount?: number;
  }>;
}

export interface MachineTransactionSummary {
  machine_id: number;
  serial_number?: string;
  machine_name?: string;
  location?: string;
  machine_type_code?: string;
  machine_type_name?: string;
  transaction_count: number;
  total_amount: number;
}

export interface MachineTransactionSummaryResponse {
  success: boolean;
  data: MachineTransactionSummary[];
  meta?: {
    count: number;
  };
}

function appendParam(
  queryParams: URLSearchParams,
  key: string,
  value: string | number | undefined
) {
  if (value !== undefined && value !== "") {
    queryParams.append(key, String(value));
  }
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getTransactionArray(response: unknown): Transaction[] {
  if (Array.isArray(response)) {
    return response as Transaction[];
  }

  if (!isRecord(response)) {
    return [];
  }

  const candidates = [
    response.data,
    response.items,
    response.transactions,
    response.records,
    response.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Transaction[];
    }

    if (isRecord(candidate)) {
      const nestedCandidates = [
        candidate.data,
        candidate.items,
        candidate.transactions,
        candidate.records,
        candidate.rows,
      ];

      const nested = nestedCandidates.find(Array.isArray);
      if (nested) {
        return nested as Transaction[];
      }
    }
  }

  return [];
}

function toTransactionList(response: unknown): TransactionListResponse {
  const data = getTransactionArray(response);
  const pagination =
    isRecord(response) && isRecord(response.pagination)
      ? (response.pagination as TransactionListResponse["pagination"])
      : undefined;

  return {
    data,
    ...(pagination ? { pagination } : {}),
  };
}

function buildTransactionEndpoint(
  basePath: string,
  params?: GetTransactionsParams
) {
  const queryParams = new URLSearchParams();
  appendParam(queryParams, "partner_id", params?.partner_id);
  appendParam(queryParams, "merchant_id", params?.merchant_id);
  appendParam(queryParams, "machine_id", params?.machine_id);
  appendParam(queryParams, "machine_type_code", params?.machine_type_code);
  appendParam(queryParams, "status", params?.status);
  appendParam(queryParams, "date_from", params?.date_from);
  appendParam(queryParams, "date_to", params?.date_to);
  appendParam(queryParams, "limit", params?.limit);
  appendParam(queryParams, "offset", params?.offset);

  const query = queryParams.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

function buildPartnerMachineTransactionEndpoint(
  partnerId: string | number,
  machineId: string | number,
  params?: Omit<GetTransactionsParams, "partner_id" | "machine_id" | "merchant_id">
) {
  return buildTransactionEndpoint(
    `/api/v1/partners/${partnerId}/machines/${machineId}/transactions`,
    params
  );
}

function normalizeRealtimeSummary(
  response: Partial<RealtimeTransactionSummary> | Transaction[] | null | undefined
): RealtimeTransactionSummary {
  if (Array.isArray(response)) {
    const paidItems = response.filter((item) =>
      ["PAID", "completed"].includes(String(item.status))
    );
    const totalAmount = response.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0
    );
    const paidAmount = paidItems.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0
    );

    return {
      total_transactions: response.length,
      total_amount: totalAmount,
      paid_transactions: paidItems.length,
      paid_amount: paidAmount,
      pending_transactions: response.filter((item) =>
        ["PENDING", "pending"].includes(String(item.status))
      ).length,
      pending_amount: response
        .filter((item) => ["PENDING", "pending"].includes(String(item.status)))
        .reduce((sum, item) => sum + toNumber(item.amount), 0),
      failed_transactions: response.filter((item) =>
        ["FAILED", "failed"].includes(String(item.status))
      ).length,
      failed_amount: response
        .filter((item) => ["FAILED", "failed"].includes(String(item.status)))
        .reduce((sum, item) => sum + toNumber(item.amount), 0),
      average_transaction:
        response.length > 0 ? Math.round(totalAmount / response.length) : 0,
      items: response,
    };
  }

  const totalTransactions = toNumber(response?.total_transactions);
  const totalAmount = toNumber(response?.total_amount);

  return {
    partner_id: response?.partner_id,
    merchant_id: response?.merchant_id,
    machine_type_code: response?.machine_type_code,
    machine_id: response?.machine_id,
    total_transactions: totalTransactions,
    total_amount: totalAmount,
    paid_transactions: toNumber(response?.paid_transactions),
    paid_amount: toNumber(response?.paid_amount),
    pending_transactions: toNumber(response?.pending_transactions),
    pending_amount: toNumber(response?.pending_amount),
    failed_transactions: toNumber(response?.failed_transactions),
    failed_amount: toNumber(response?.failed_amount),
    average_transaction:
      toNumber(response?.average_transaction) ||
      (totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0),
    period: response?.period,
    items: response?.items,
    by_machine_type: response?.by_machine_type,
  };
}



export async function getTransactions(
  params?: GetTransactionsParams
): Promise<TransactionListResponse> {
  return toTransactionList(
    await apiCall<unknown>(
      buildTransactionEndpoint("/api/v1/transactions", params),
      { method: "GET" }
    )
  );
}

export async function getCurrentMerchantTransactions(
  params?: Omit<GetTransactionsParams, "merchant_id" >
): Promise<TransactionListResponse> {
  const partnerId = getPartnerId();

  return getTransactions({
    ...params,
    ...(partnerId ? { partner_id: partnerId } : {}),
  });
}

export async function getPartnerMachineTransactions(
  partnerId: string | number,
  machineId: string | number,
  params?: Omit<GetTransactionsParams, "partner_id" | "machine_id" | "merchant_id">
): Promise<TransactionListResponse> {
  return toTransactionList(
    await apiCall<unknown>(
      buildPartnerMachineTransactionEndpoint(partnerId, machineId, params),
      { method: "GET" }
    )
  );
}

export async function getCurrentPartnerMachineTransactions(
  machineId: string | number,
  params?: Omit<GetTransactionsParams, "partner_id" | "machine_id" | "merchant_id">
): Promise<TransactionListResponse> {
  const partnerId = getPartnerId();

  if (!partnerId) {
    return { data: [] };
  }

  return getPartnerMachineTransactions(partnerId, machineId, params);
}

export async function getRealtimeTransactions(
  params?: Omit<GetTransactionsParams, "limit" | "offset">
): Promise<RealtimeTransactionSummary> {
  const response = await apiCall<
    Partial<RealtimeTransactionSummary> | Transaction[]
  >(buildTransactionEndpoint("/api/v1/transactions/realtime", params), {
    method: "GET",
  });

  return normalizeRealtimeSummary(response);
}

export async function getCurrentMerchantRealtimeTransactions(
  params?: Omit<GetTransactionsParams, "merchant_id" | "limit" | "offset">
): Promise<RealtimeTransactionSummary> {
  const partnerId = getPartnerId();
  return getRealtimeTransactions({
    ...params,
    ...(partnerId ? { partner_id: partnerId } : {}),
  });

}

export async function getPartnerTransactionSummaryPerMachine(
  machineId: string | number
): Promise<MachineTransactionSummary[]> {
  const response = await apiCall<MachineTransactionSummaryResponse>(
    `/api/v1/partners/transaction-summary-per-machine?machine_id=${machineId}`,
    { method: "GET" }
  );

  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response as MachineTransactionSummary[];
  }

  if (isRecord(response) && Array.isArray(response.data)) {
    return response.data as MachineTransactionSummary[];
  }

  return [];
}

export async function getCurrentPartnerTransactionSummaryPerMachine(
  machineIds?: (string | number)[]
): Promise<MachineTransactionSummary[]> {
  if (!machineIds || machineIds.length === 0) {
    return [];
  }

  // Fetch transaction summary for multiple machines
  const results = await Promise.all(
    machineIds.map((machineId) =>
      getPartnerTransactionSummaryPerMachine(machineId).catch(() => [])
    )
  );

  // Flatten the results
  return results.flat();
}
