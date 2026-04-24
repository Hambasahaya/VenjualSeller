/**
 * Product Management Service
 * Handles: product creation, listing, retrieval, updates, deletion
 */

import { apiCall } from "./api";

export interface Product {
  id: number;
  code?: string;
  name: string;
  description?: string;
  price?: number;
  default_price?: number;
  currency?: string;
  status?: string;
  partner_id?: string | number;
  merchant_id?: string;
  machine_id?: string | number;
  image_url?: string;
  image?: string;
  category?: string;
  tag?: string;
  sku?: string;
  stock?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  code?: string;
  name: string;
  description?: string;
  price?: number;
  default_price?: number;
  currency?: string;
  status?: string;
  partner_id?: string | number;
  merchant_id?: string;
  machine_id?: string | number;

  sku?: string;
  stock?: number;
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  description?: string;
  price?: number;
  default_price?: number;
  currency?: string;
  status?: string;

  sku?: string;
  stock?: number;
}

export interface ProductListResponse {
  data: Product[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface GetProductsParams {
  limit?: number;
  offset?: number;
  search?: string;
  partner_id?: string | number;
  merchant_id?: string;
  machine_id?: string | number;
  include_deleted?: boolean;
}

export interface CreatePartnerMachineProductRequest {
  code: string;
  name: string;
  default_price: number;
  currency?: string;
  status?: string;
  category?: string;
  brand?: string;
  tag?: string;
  stock?: number;
  description?: string;
  image_url?: string;
}

export interface UpdatePartnerMachineProductRequest {
  code?: string;
  name?: string;
  default_price?: number;
  currency?: string;
  status?: string;
  category?: string;
  brand?: string;
  tag?: string;
  stock?: number;
  description?: string;
  image_url?: string;
}




function toProductList(response: Product[] | ProductListResponse): ProductListResponse {
  if (Array.isArray(response)) {
    return{data:response};
    
  }

return response;
}



/**
 * Create a new product
 */

export async function createProduct(
  data: CreateProductRequest
): Promise<Product> {
  return apiCall<Product>("/api/v1/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
/**
 * Get all products with filtering and pagination
 */

export async function getProducts(
  params?: GetProductsParams
): Promise<ProductListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.partner_id)
    queryParams.append("partner_id", String(params.partner_id));
  if (params?.merchant_id)
    queryParams.append("merchant_id", params.merchant_id);
  if (params?.machine_id)
    queryParams.append("machine_id", String(params.machine_id));
  if (params?.include_deleted)
    queryParams.append("include_deleted", params.include_deleted.toString());
  const query = queryParams.toString();
  const endpoint = `/api/v1/products${query ? `?${query}` : ""}`;

  return toProductList(
    await apiCall<Product[] | ProductListResponse>(endpoint, {
      method: "GET",
    })
  );
}

/**
 * Get product details by ID
 */

export async function getProduct(productId: number): Promise<Product> {
  return apiCall<Product>(`/api/v1/products/${productId}`, {
    method: "GET",
  });
}
/**
 * Update product information
 */
export async function updateProduct(
  productId: number,
  data: UpdateProductRequest
): Promise<Product> {
  return apiCall<Product>(`/api/v1/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(
  productId: number
): Promise<{ message: string }> {
  return apiCall<{ message: string }>(`/api/v1/products/${productId}`, {
    method: "DELETE",
  });
}

/**
 * Get products linked to a specific partner and machine.
 */
export async function getPartnerMachineProducts(
  partnerId: string | number,
  machineId: string | number
): Promise<ProductListResponse> {
  return toProductList(
    await apiCall<Product[] | ProductListResponse>(
      `/api/v1/partners/${partnerId}/machines/${machineId}/products`,
      { method: "GET" }
    )
  );
}

/**
 * Create a product and link it to the given partner and machine.
 */
export async function createPartnerMachineProduct(
  partnerId: string | number,
  machineId: string | number,
  data: CreatePartnerMachineProductRequest
): Promise<Product> {
  return apiCall<Product>(
    `/api/v1/partners/${partnerId}/machines/${machineId}/products`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update a product linked to the given partner and machine.
 */
export async function updatePartnerMachineProduct(
  partnerId: string | number,
  machineId: string | number,
  productId: number,
  data: UpdatePartnerMachineProductRequest
): Promise<Product> {
  return apiCall<Product>(
    `/api/v1/partners/${partnerId}/machines/${machineId}/products/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Soft delete a product linked to the given partner and machine.
 */
export async function deletePartnerMachineProduct(
  partnerId: string | number,
  machineId: string | number,
  productId: number
): Promise<{ message: string }> {
  return apiCall<{ message: string }>(
    `/api/v1/partners/${partnerId}/machines/${machineId}/products/${productId}`,
    { method: "DELETE" }
  );
}
