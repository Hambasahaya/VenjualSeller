/**
 * Machine Management Service
 * Handles: machine listing, detail retrieval, and updates
 */
import { apiCall, getPartnerId } from "./api";
export type MachineType =
  | "vending"
  | "locker"
  | "lockerlaundry"
  | "lockerloundry"
  | "VMJ"
  | "LOCKERLAUNDRY"
  | "LOCKERLOUNDRY"
  | string;
export type MachineStatus = "active" | "maintenance" | "inactive";

export interface Machine {
  id: string | number;
  machine_id?: string | number;
  machine_serial_number?: string;
  machineSerialNumber?: string;
  serial_number?: string;
  serialNumber?: string;
  merchant_id?: string;
  partner_id?: string | number;
  type?: MachineType | string;
  machine_type_code?: string;
  machine_type?: string;
  mechine_type?: string;
  mechine_type_code?: string;
  name?: string;
  location_name?: string;
  location?: string;
  address?: string;
  daily_earning?: number;
  commission_percentage?: number;
  commission_amount?: number;
  transaction_count?: number;
  capacity?: number;
  utilities?: number;
  status?: MachineStatus | string;
  installation_date?: string;
  cctv_status?: string;
  channels?: number;
  products?: number;
  image_url?: string;
  wifi_ssid?: string;
  wifi_enabled?: boolean;
  power_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GetMachinesParams {
  merchant_id?: string;
  partner_id?: string | number;
  type?: MachineType;
  machine_type_code?: string;
  status?: MachineStatus;
  limit?: number;
  offset?: number;
  search?: string;
  q?: string;
  include_deleted?: boolean;
}

export interface MachineListResponse {
  data: Machine[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface UpdateMachineRequest {
  name?: string;
  location_name?: string;
  location?: string;
  address?: string;
  type?: MachineType | string;
  machine_type_code?: string;
  status?: MachineStatus | string;
  wifi_ssid?: string;
  wifi_password?: string;
  image_url?: string;
  power_enabled?: boolean;
}

function toMachineList(response: Machine[] | MachineListResponse): MachineListResponse {
  if (Array.isArray(response)) {
    return { data: response };
  }

  return response;
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

/**
 * Get all machines with optional filtering and pagination
 */
export async function getMachines(
  params?: GetMachinesParams
): Promise<MachineListResponse> {
  const queryParams = new URLSearchParams();
  appendParam(queryParams, "merchant_id", params?.merchant_id);
  appendParam(queryParams, "partner_id", params?.partner_id);
  appendParam(queryParams, "type", params?.type);
  appendParam(queryParams, "machine_type_code", params?.machine_type_code);
  appendParam(queryParams, "status", params?.status);
  appendParam(queryParams, "limit", params?.limit);
  appendParam(queryParams, "offset", params?.offset);
  appendParam(queryParams, "search", params?.search);
  appendParam(queryParams, "q", params?.q);
  if (params?.include_deleted !== undefined) {
    queryParams.append("include_deleted", String(params.include_deleted));
  }

  const query = queryParams.toString();
  const endpoint = `/api/v1/machines${query ? `?${query}` : ""}`;

  return toMachineList(
    await apiCall<Machine[] | MachineListResponse>(endpoint, {
      method: "GET",
    })
  );
}

/**
 * Get machines for the current partner when partner context is available.
 */
export async function getCurrentMerchantMachines(
  params?: Omit<GetMachinesParams, "merchant_id" | "partner_id">
): Promise<MachineListResponse> {
 
  const partnerId = getPartnerId();

  return getMachines({
    ...params,
    ...(partnerId ? { partner_id: partnerId } : {}),
  });
}

/**
 * Get machine details by machine ID
 */
export async function getMachine(machineId: string): Promise<Machine> {
  return apiCall<Machine>(`/api/v1/machines/${machineId}`, {
    method: "GET",
  });
}

/**
 * Update machine information
 */
export async function updateMachine(
  machineId: string,
  data: UpdateMachineRequest
): Promise<Machine> {
  return apiCall<Machine>(`/api/v1/machines/${machineId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
