/**
 * Machine submission service
 * Handles: create submission, list submissions, and current-partner submission history
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

export type MachineSubmissionCategory =
  | "vending_machine"
  | "locker_laundry"
  | string;
export type MachineSubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | string;

export interface MachineSubmission {
  id: string;
  partner_id?: string | number;
  kategori_mesin?: MachineSubmissionCategory;
  lokasi?: string;
  deskripsi?: string;
  status_pengajuan?: MachineSubmissionStatus;
  catatan_admin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMachineSubmissionRequest {
  partner_id?: string | number;
  kategori_mesin: MachineSubmissionCategory;
  lokasi: string;
  deskripsi: string;
}

export interface GetMachineSubmissionsParams {
  limit?: number;
  offset?: number;
  kategori_mesin?: MachineSubmissionCategory;
  status_pengajuan?: MachineSubmissionStatus;
}

export interface MachineSubmissionListResponse {
  data: MachineSubmission[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

type MachineSubmissionApi = Partial<MachineSubmission> & {
  id?: string | number;
  pengajuan_id?: string | number;
  submission_id?: string | number;
  kategoriMesin?: MachineSubmissionCategory;
  description?: string;
  location?: string;
  status?: MachineSubmissionStatus;
  notes?: string;
  partner?: {
    id?: string | number;
    partner_id?: string | number;
  };
};

type MachineSubmissionListApiResponse =
  | MachineSubmissionApi[]
  | {
      data?: MachineSubmissionApi[];
      total?: number | string;
      limit?: number | string;
      offset?: number | string;
      pagination?: Partial<MachineSubmissionListResponse["pagination"]>;
    };

function appendParam(
  queryParams: URLSearchParams,
  key: string,
  value: string | number | undefined
): void {
  if (value !== undefined && value !== "") {
    queryParams.append(key, String(value));
  }
}

function toNumber(value: unknown, fallbackValue: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallbackValue;
}

function addPartnerCandidate(
  candidates: string[],
  candidate: string | null | undefined
): void {
  if (!candidate || candidates.includes(candidate)) {
    return;
  }

  candidates.push(candidate);
}

async function getCurrentPartnerCandidates(): Promise<string[]> {
  const candidates: string[] = [];

  addPartnerCandidate(candidates, getPartnerId());
  addPartnerCandidate(candidates, getPartnerIdFromToken(getAuthToken()));

  try {
    addPartnerCandidate(
      candidates,
      extractPartnerId(await getCurrentUserProfile()) ?? getPartnerId()
    );
  } catch {
    // User profile is only a best-effort fallback source.
  }

  return candidates;
}

function getMissingPartnerContextError(): ApiError {
  return createApiError(
    "partner_context_missing",
    "Data partner belum tersedia. Silakan login kembali dengan akun partner.",
    401
  );
}

function shouldTryNextPartnerCandidate(error: ApiError): boolean {
  return (
    [400, 401, 403, 404].includes(error.status) ||
    (error.status === 422 && error.code === "validation_error")
  );
}

async function withCurrentPartner<T>(
  request: (partnerId: string) => Promise<T>
): Promise<T> {
  const candidates = await getCurrentPartnerCandidates();

  if (candidates.length === 0) {
    throw getMissingPartnerContextError();
  }

  let lastError = getMissingPartnerContextError();

  for (const candidate of candidates) {
    try {
      const response = await request(candidate);
      setPartnerId(candidate);
      return response;
    } catch (error) {
      const apiError = normalizeApiError(error);
      lastError = apiError;

      if (!shouldTryNextPartnerCandidate(apiError)) {
        throw apiError;
      }
    }
  }

  throw lastError;
}

function normalizeMachineSubmission(
  submission: MachineSubmissionApi
): MachineSubmission {
  const resolvedId =
    submission.id ??
    submission.pengajuan_id ??
    submission.submission_id ??
    [
      submission.partner_id ??
        submission.partner?.partner_id ??
        submission.partner?.id ??
        "submission",
      submission.created_at ?? "unknown",
      submission.kategori_mesin ?? submission.kategoriMesin ?? "machine",
      submission.lokasi ?? submission.location ?? "location",
    ].join("-");

  return {
    id: String(resolvedId),
    partner_id:
      submission.partner_id ??
      submission.partner?.partner_id ??
      submission.partner?.id,
    kategori_mesin: submission.kategori_mesin ?? submission.kategoriMesin,
    lokasi: submission.lokasi ?? submission.location,
    deskripsi: submission.deskripsi ?? submission.description,
    status_pengajuan: submission.status_pengajuan ?? submission.status,
    catatan_admin: submission.catatan_admin ?? submission.notes,
    created_at: submission.created_at,
    updated_at: submission.updated_at,
  };
}

function toMachineSubmissionList(
  response: MachineSubmissionListApiResponse,
  params?: GetMachineSubmissionsParams
): MachineSubmissionListResponse {
  const list = Array.isArray(response) ? response : response.data ?? [];
  const pagination = Array.isArray(response) ? undefined : response.pagination;
  const total = Array.isArray(response) ? undefined : response.total;
  const limit = Array.isArray(response) ? undefined : response.limit;
  const offset = Array.isArray(response) ? undefined : response.offset;

  return {
    data: list.map(normalizeMachineSubmission),
    pagination: pagination || total !== undefined || limit !== undefined || offset !== undefined
      ? {
          total: toNumber(pagination?.total ?? total, list.length),
          limit: toNumber(
            pagination?.limit ?? limit,
            params?.limit ?? list.length
          ),
          offset: toNumber(pagination?.offset ?? offset, params?.offset ?? 0),
        }
      : undefined,
  };
}

function buildSubmissionQuery(params?: GetMachineSubmissionsParams): string {
  const queryParams = new URLSearchParams();

  appendParam(queryParams, "limit", params?.limit);
  appendParam(queryParams, "offset", params?.offset);
  appendParam(queryParams, "kategori_mesin", params?.kategori_mesin);
  appendParam(queryParams, "status_pengajuan", params?.status_pengajuan);

  const query = queryParams.toString();
  return query ? `?${query}` : "";
}

export async function createMachineSubmission(
  data: CreateMachineSubmissionRequest
): Promise<MachineSubmission> {
  return normalizeMachineSubmission(
    await apiCall<MachineSubmissionApi>("/api/v1/pengajuan-mesin", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );
}

export async function createCurrentPartnerMachineSubmission(
  data: Omit<CreateMachineSubmissionRequest, "partner_id"> & {
    partner_id?: string | number;
  }
): Promise<MachineSubmission> {
  if (data.partner_id !== undefined && data.partner_id !== "") {
    return createMachineSubmission(data);
  }

  return withCurrentPartner((partnerId) =>
    createMachineSubmission({
      ...data,
      partner_id: partnerId,
    })
  );
}

export async function getMachineSubmissions(
  params?: GetMachineSubmissionsParams
): Promise<MachineSubmissionListResponse> {
  return toMachineSubmissionList(
    await apiCall<MachineSubmissionListApiResponse>(
      `/api/v1/pengajuan-mesin${buildSubmissionQuery(params)}`,
      {
        method: "GET",
      }
    ),
    params
  );
}

export async function getPartnerMachineSubmissions(
  partnerId: string | number,
  params?: GetMachineSubmissionsParams
): Promise<MachineSubmissionListResponse> {
  return toMachineSubmissionList(
    await apiCall<MachineSubmissionListApiResponse>(
      `/api/v1/partners/${partnerId}/pengajuan-mesin${buildSubmissionQuery(
        params
      )}`,
      {
        method: "GET",
      }
    ),
    params
  );
}

export async function getCurrentPartnerMachineSubmissions(
  params?: GetMachineSubmissionsParams
): Promise<MachineSubmissionListResponse> {
  return withCurrentPartner((partnerId) =>
    getPartnerMachineSubmissions(partnerId, params)
  );
}
