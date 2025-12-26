import api from "@/lib/api";
import { ItemInstance } from "./inventoryService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface TransactionHistory {
  transactionId: number;
  transactionType: string;
  status: string;
  date: string;
  fromOffice?: string;
  fromOfficeCode?: string;
  toOffice?: string;
  toOfficeCode?: string;
  initiatedBy: string;
  initiatedByUsername: string;
  confirmedBy?: string;
  confirmedByUsername?: string;
  confirmedDate?: string;
  quantity: number;
  remarks?: string;
}

export interface PurchaseInformation {
  purchaseId: number;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  supplier?: string;
  purchasedBy: string;
  purchasedByUsername: string;
  purchasedForOffice: string;
  purchaseDate: string;
  remarks?: string;
}

export interface MovementSummary {
  totalTransfers: number;
  confirmedTransfers: number;
  rejectedTransfers: number;
  pendingTransfers: number;
}

export interface BarcodeSearchResult {
  barcode: string;
  itemId: number;
  itemName: string;
  itemDescription?: string;
  category: string;
  serialNumber?: string;
  currentStatus: string;
  currentOwnerOffice: string;
  currentOwnerOfficeCode?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  remarks?: string;
  createdAt: string;
  purchaseInformation?: PurchaseInformation;
  movementHistory: TransactionHistory[];
  totalMovements: number;
  movementSummary: MovementSummary;
  officeJourney: string[];
}

// Track item by barcode
export const trackByBarcode = async (barcode: string): Promise<BarcodeSearchResult> => {
  const response = await api.get(`/tracking/barcode/${barcode}`);
  return response.data;
};

// Bulk barcode search
export const bulkBarcodeSearch = async (barcodes: string[]): Promise<BarcodeSearchResult[]> => {
  const response = await api.post("/tracking/barcodes", { barcodes });
  return response.data;
};

// React Query Hooks
export const useTrackByBarcode = (barcode: string) => {
  return useQuery({
    queryKey: ['tracking', 'barcode', barcode],
    queryFn: () => trackByBarcode(barcode),
    enabled: !!barcode,
  });
};

export const useBulkBarcodeSearch = () => {
  return useMutation({
    mutationFn: bulkBarcodeSearch,
  });
};
