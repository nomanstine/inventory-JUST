import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PurchaseItem {
  id: number;
  item: {
    id: number;
    name: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemInstanceIds?: number[];  // IDs of created item instances
  itemBarcodes?: string[];     // Barcodes of created item instances
}

export interface Purchase {
  id: number;
  purchasedDate: string;
  supplier: string;
  invoiceNumber?: string;
  remarks?: string;
  receiptUrl?: string;
  items: PurchaseItem[];
  totalAmount: number;
  totalItems: number;
  office: {
    id: number;
    name: string;
  };
  purchasedBy: {
    id: number;
    username: string;
    name?: string;
    fullName?: string;
  };
}

export interface CreatePurchaseItemRequest {
  itemId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseRequest {
  supplier: string;
  invoiceNumber?: string;
  remarks?: string;
  receiptUrl?: string;
  items: CreatePurchaseItemRequest[];
}

// Create a new purchase
export const createPurchase = async (purchase: CreatePurchaseRequest): Promise<Purchase> => {
  const response = await api.post("/purchases", purchase);
  return response.data;
};

// Get all purchases for current user's office
export const getPurchases = async (): Promise<Purchase[]> => {
  const response = await api.get("/purchases");
  return response.data;
};

// Get purchase by ID
export const getPurchaseById = async (id: number): Promise<Purchase> => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

// Get purchases by office
export const getPurchasesByOffice = async (officeId: number): Promise<Purchase[]> => {
  const response = await api.get(`/purchases/office/${officeId}`);
  return response.data;
};

// React Query Hooks
export const usePurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  });
};

export const usePurchase = (id: number) => {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: () => getPurchaseById(id),
    enabled: !!id,
  });
};

export const usePurchasesByOffice = (officeId: number) => {
  return useQuery({
    queryKey: ['purchases', 'office', officeId],
    queryFn: () => getPurchasesByOffice(officeId),
    enabled: !!officeId,
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
};
