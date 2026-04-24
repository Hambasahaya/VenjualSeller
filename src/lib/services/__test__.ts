/**
 * Test file untuk memverifikasi semua API services dapat diimport dengan baik
 * File ini hanya untuk verifikasi, bukan bagian dari aplikasi
 */

// Test import semua services
import {
  // API Base
  apiCall,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getUserId,
  setUserId,
  getMerchantId,
  setMerchantId,
  
  // User Service
  registerUser,
  loginUser,
  verifyEmail,
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  updateCurrentUserProfile,
  updatePassword,
  updateCurrentPassword,
  
  // Merchant Service
  getMerchantBalance,
  getCurrentMerchantBalance,
  requestWithdrawal,
  requestCurrentWithdrawal,
  getMerchantHistory,
  getCurrentMerchantHistory,
  getMerchantTransactionSummary,
  getCurrentMerchantTransactionSummary,
  updateWiFiSettings,
  updateCurrentWiFiSettings,
  
  // Payment Service
  createPayment,
  getPayment,
  
  // Product Service
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  
  // Channel Service
  updateChannel,
} from '@/lib/services';

// Test types
import type {
  ApiResponse,
  ApiError,
  User,
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  VerifyEmailRequest,
  UpdatePasswordRequest,
  MerchantBalance,
  Withdrawal,
  WithdrawalRequest,
  Transaction,
  TransactionSummary,
  WiFiSettingRequest,
  Payment,
  PaymentItem,
  CreatePaymentRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListResponse,
  GetProductsParams,
  Channel,
  UpdateChannelRequest,
} from '@/lib/services';

console.log('✅ Semua services berhasil diimport');
console.log('✅ Semua types berhasil diimport');

export { };
