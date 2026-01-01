import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Purchase {
  id: number;
  purchasedDate: string;
  supplier: string;
  remarks?: string;
  quantity: number;
  unitPrice: number;
  receiptUrl?: string;
  item: {
    id: number;
    name: string;
  };
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

export interface PurchaseForm {
  item: {
    id: number;
  };
  quantity: number;
  unitPrice: number;
  supplier: string;
  remarks?: string;
  receiptUrl?: string;
}

// Create a new purchase
export const createPurchase = async (purchase: PurchaseForm): Promise<Purchase> => {
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
