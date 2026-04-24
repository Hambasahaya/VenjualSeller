/**
 * Analytics Service
 * Handles: top locations, top products, and daily sales.
 */

import { apiCall, getPartnerId } from "./api";

export interface AnalyticsParams {
  merchant_id?: string;
  partner_id?: string | number;
  machine_type_code?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface TopLocation {
  rank?: number;
  name?: string;
  location_name?: string;
  address?: string;
  transactions?: number;
  total_transactions?: number;
  amount?: number;
  total_amount?: number;
  growth?: string | number;
}

export interface TopProduct {
  rank?: number;
  name?: string;
  product_name?: string;
  sold?: number;
  total_sold?: number;
  transactions?: number;
  amount?: number;
  total_amount?: number;
  growth?: string | number;
}

export interface DailySale {
  date: string;
  amount?: number;
  total_amount?: number;
  transactions?: number;
  total_transactions?: number;
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

function buildEndpoint(path: string, params?: AnalyticsParams) {
  const queryParams = new URLSearchParams();
  appendParam(queryParams, "merchant_id", params?.merchant_id);
  appendParam(queryParams, "partner_id", params?.partner_id);
  appendParam(queryParams, "date_from", params?.date_from);
  appendParam(queryParams, "date_to", params?.date_to);
  appendParam(queryParams, "machine_type_code", params?.machine_type_code);
  appendParam(queryParams, "limit", params?.limit);

  const query = queryParams.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

function toList<T>(response: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.data ?? [];
}

function withCurrentMerchant(params?: AnalyticsParams): AnalyticsParams {

  const partnerId = getPartnerId();

  return {
    ...params,
    ...(partnerId && !params?.partner_id ? { partner_id: partnerId } : {}),
  };
}

export async function getTopLocations(
  params?: AnalyticsParams
): Promise<TopLocation[]> {
  return toList(
    await apiCall<TopLocation[] | { data?: TopLocation[] } | null>(
      buildEndpoint("/api/v1/analytics/top-locations", params),
      { method: "GET" }
    )
  );
}

export async function getCurrentMerchantTopLocations(
  params?: AnalyticsParams
): Promise<TopLocation[]> {
  return getTopLocations(withCurrentMerchant(params));
}

export async function getTopProducts(
  params?: AnalyticsParams
): Promise<TopProduct[]> {
  return toList(
    await apiCall<TopProduct[] | { data?: TopProduct[] } | null>(
      buildEndpoint("/api/v1/analytics/top-products", params),
      { method: "GET" }
    )
  );
}

export async function getCurrentMerchantTopProducts(
  params?: AnalyticsParams
): Promise<TopProduct[]> {
  return getTopProducts(withCurrentMerchant(params));
}

export async function getDailySales(
  params?: AnalyticsParams
): Promise<DailySale[]> {
  return toList(
    await apiCall<DailySale[] | { data?: DailySale[] } | null>(
      buildEndpoint("/api/v1/analytics/daily-sales", params),
      { method: "GET" }
    )
  );
}

export async function getCurrentMerchantDailySales(
  params?: AnalyticsParams
): Promise<DailySale[]> {
  return getDailySales(withCurrentMerchant(params));
}
