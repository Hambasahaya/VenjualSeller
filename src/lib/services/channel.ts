/**
 * Channel/Machine Management Service
 * Handles: channel configuration and management
 */

import { apiCall } from "./api";

export interface Channel {
  id: number;
  name: string;
  tray_label?: string;
  jenis_mesin?: string;
  machine_type_code?: string;
  machine_serial_number?: string;
  machineSerialNumber?: string;
  function?: string;
  machine_id?: string | number;
  merchant_id?: string;
  controller_id?: number;
  product_id?: number;
  product_name?: string;
  productName?: string;
  product?: {
    id?: number;
    name?: string;
    price?: number;
    stock?: number;
  };
  capacity?: number;
  stock?: number;
  price_now?: number;
  status?: string;
  status_now?: string;
  active?: string | boolean;
  tray_type?: string;
  spiral_diameter?: string;
  tray_size?: string;
  door_size?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetChannelsParams {
  machine_id?: string | number;
  merchant_id?: string;
  limit?: number;
  offset?: number;
}

export interface ChannelListResponse {
  data: Channel[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface UpdateChannelRequest {
  name?: string;
  jenis_mesin?: string;
  machine_type_code?: string;
  tray_label?: string;
  function?: string;
  machine_id?: string | number;
  merchant_id?: string;
  controller_id?: number;
  controller_channel_id?: number;
  product_id?: number;
  capacity?: number;
  stock?: number;
  price_now?: number;
  status?: string;
  status_now?: string;
  active?: string | boolean;
  tray_type?: string;
  spiral_diameter?: string;
  tray_size?: string;
  door_size?: string;
  is_active?: boolean;
}

function toChannelList(response: Channel[] | ChannelListResponse): ChannelListResponse {
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
 * Get channels with optional filtering.
 */
export async function getChannels(
  params?: GetChannelsParams
): Promise<ChannelListResponse> {
  const queryParams = new URLSearchParams();
  appendParam(queryParams, "machine_id", params?.machine_id);
  appendParam(queryParams, "merchant_id", params?.merchant_id);
  appendParam(queryParams, "limit", params?.limit);
  appendParam(queryParams, "offset", params?.offset);

  const query = queryParams.toString();
  const endpoint = `/api/v1/channels${query ? `?${query}` : ""}`;

  return toChannelList(
    await apiCall<Channel[] | ChannelListResponse>(endpoint, {
      method: "GET",
    })
  );
}

/**
 * Update channel/machine configuration
 */

export async function updateChannel(
  channelId: number,
  data: UpdateChannelRequest
): Promise<Channel> {
  return apiCall<Channel>(`/api/v1/channels/${channelId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
