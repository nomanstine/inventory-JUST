import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ItemInstance {
  id: number;
  barcode: string;
  item: {
    id: number;
    name: string;
    description?: string;
    category?: {
      id: number;
      name: string;
    };
    unit?: {
      id: number;
      name: string;
    };
    price?: number;
  };
  ownerOffice: {
    id: number;
    name: string;
    code?: string;
  };
  currentOffice?: {
    id: number;
    name: string;
    code?: string;
  };
  status: string;
  condition?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  remarks?: string;
}

export interface Inventory {
  id: number;
  office: {
    id: number;
    name: string;
  };
  totalItems: number;
  totalValue: number;
}

export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  itemsByCategory: Record<string, number>;
  itemsByStatus: Record<string, number>;
}

export interface Purchase {
  id: number;
  item: {
    id: number;
    name: string;
    description?: string;
    category?: {
      id: number;
      name: string;
    };
    unit?: {
      id: number;
      name: string;
    };
    price?: number;
  };
  quantity: number;
  purchasedBy: {
    id: number;
    fullName: string;
    username: string;
  };
  office: {
    id: number;
    name: string;
    code?: string;
  };
  unitPrice: number;
  supplier?: string;
  remarks?: string;
  purchasedDate: string;
}

export interface ItemTransaction {
  id: number;
  itemInstance: {
    id: number;
    barcode: string;
    item: {
      id: number;
      name: string;
      category?: {
        id: number;
        name: string;
      };
    };
  };
  fromOffice: {
    id: number;
    name: string;
    code?: string;
  };
  toOffice: {
    id: number;
    name: string;
    code?: string;
  };
  user: {
    id: number;
    fullName: string;
    username: string;
  };
  transactionType: string;
  quantity: number;
  remarks?: string;
  transactionDate: string;
  status: string;
  confirmedBy?: {
    id: number;
    fullName: string;
    username: string;
  };
  confirmedDate?: string;
}

// Get inventory by office
export const getInventoryByOffice = async (officeId: number): Promise<Inventory> => {
  const response = await api.get(`/inventories/office/${officeId}`);
  return response.data;
};

// Get item instances by office
export const getItemInstancesByOffice = async (officeId: number): Promise<ItemInstance[]> => {
  const response = await api.get(`/inventories/office/${officeId}/items`);
  return response.data;
};

// Get inventory summary by office
export const getInventorySummary = async (officeId: number): Promise<InventorySummary> => {
  const response = await api.get(`/inventories/office/${officeId}/summary`);
  return response.data;
};

// Get item instance by ID
export const getItemInstanceById = async (id: number): Promise<ItemInstance> => {
  const response = await api.get(`/inventories/items/${id}`);
  return response.data;
};

// Get current user's office inventory
export const getMyOfficeInventory = async (): Promise<ItemInstance[]> => {
  const response = await api.get(`/inventories/my-office`);
  return response.data;
};

// Get current user's office inventory summary
export const getMyOfficeInventorySummary = async (): Promise<InventorySummary> => {
  const response = await api.get(`/inventories/my-office/summary`);
  return response.data;
};

// Get purchases for current user's office
export const getMyOfficePurchases = async (): Promise<Purchase[]> => {
  const response = await api.get(`/purchases`);
  return response.data;
};

// Get transaction history for current user's office
export const getMyOfficeTransactionHistory = async (): Promise<ItemTransaction[]> => {
  const response = await api.get(`/distributions/my-office/history`);
  return response.data;
};

// React Query Hooks
export const useInventoryByOffice = (officeId: number) => {
  return useQuery({
    queryKey: ['inventory', 'office', officeId],
    queryFn: () => getInventoryByOffice(officeId),
    enabled: !!officeId,
  });
};

export const useItemInstancesByOffice = (officeId: number) => {
  return useQuery({
    queryKey: ['inventory', 'office', officeId, 'items'],
    queryFn: () => getItemInstancesByOffice(officeId),
    enabled: !!officeId,
  });
};

export const useInventorySummary = (officeId: number) => {
  return useQuery({
    queryKey: ['inventory', 'office', officeId, 'summary'],
    queryFn: () => getInventorySummary(officeId),
    enabled: !!officeId,
  });
};

export const useItemInstance = (id: number) => {
  return useQuery({
    queryKey: ['inventory', 'items', id],
    queryFn: () => getItemInstanceById(id),
    enabled: !!id,
  });
};

export const useMyOfficeInventory = () => {
  return useQuery({
    queryKey: ['inventory', 'my-office'],
    queryFn: getMyOfficeInventory,
  });
};

export const useMyOfficeInventorySummary = () => {
  return useQuery({
    queryKey: ['inventory', 'my-office', 'summary'],
    queryFn: getMyOfficeInventorySummary,
  });
};

export const useMyOfficePurchases = () => {
  return useQuery({
    queryKey: ['purchases', 'my-office'],
    queryFn: getMyOfficePurchases,
  });
};

export const useMyOfficeTransactionHistory = () => {
  return useQuery({
    queryKey: ['transactions', 'my-office', 'history'],
    queryFn: getMyOfficeTransactionHistory,
  });
};
