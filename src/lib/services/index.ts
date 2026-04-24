/**
 * Services Index
 * Central export point for all API services
 */

// API Configuration & Base Client
export * from "./api";

// User & Authentication
export * from "./user";

// Merchant Operations
export * from "./merchant";

// Payments
export * from "./payment";

// Transactions
export {
  getCurrentMerchantRealtimeTransactions,
  getCurrentMerchantTransactions,
  getCurrentPartnerMachineTransactions,
  getCurrentPartnerTransactionSummaryPerMachine,
  getPartnerMachineTransactions,
  getPartnerTransactionSummaryPerMachine,
  getRealtimeTransactions,
  getTransactions,
} from "./transaction";

// Analytics
export * from "./analytics";
export type {
  GetTransactionsParams,
  MachineTransactionSummary,
  MachineTransactionSummaryResponse,
  RealtimeTransactionSummary,
  Transaction as ApiTransaction,
  TransactionListResponse,
  TransactionStatus,
} from "./transaction";

// Products
export * from "./product";

// Channels/Machines
export * from "./channel";
export * from "./machine";

// Machine submissions
export * from "./machine-submission";
