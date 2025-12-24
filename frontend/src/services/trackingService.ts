import api from "@/lib/api";
import { ItemInstance } from "./inventoryService";

export interface BarcodeSearchResult {
  itemInstance: ItemInstance;
  transactionHistory: Array<{
    id: number;
    transactionDate: string;
    transactionType: string;
    fromOffice?: {
      id: number;
      name: string;
    };
    toOffice?: {
      id: number;
      name: string;
    };
    remarks?: string;
  }>;
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
