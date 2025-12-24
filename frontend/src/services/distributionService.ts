import api from "@/lib/api";

export interface ItemTransaction {
  id: number;
  transactionDate: string;
  transactionType: string;
  quantity: number;
  fromOffice?: {
    id: number;
    name: string;
    code?: string;
  };
  toOffice?: {
    id: number;
    name: string;
    code?: string;
  };
  item: {
    id: number;
    name: string;
  };
  itemInstance?: {
    id: number;
    barcode: string;
  };
  initiatedBy: {
    id: number;
    username: string;
    name?: string;
  };
  status: string;
  remarks?: string;
}

export interface DistributionRequest {
  fromOfficeId: number;
  toOfficeId: number;
  itemId: number;
  quantity: number;
  remarks?: string;
}

// Distribute items between offices
export const distributeItems = async (request: DistributionRequest): Promise<ItemTransaction[]> => {
  const response = await api.post("/distributions", request);
  return response.data;
};

// Get transaction history for an office
export const getOfficeTransactionHistory = async (officeId: number): Promise<ItemTransaction[]> => {
  const response = await api.get(`/distributions/office/${officeId}/history`);
  return response.data;
};

// Get transaction history for a specific item instance
export const getItemTransactionHistory = async (itemInstanceId: number): Promise<ItemTransaction[]> => {
  const response = await api.get(`/distributions/item/${itemInstanceId}/history`);
  return response.data;
};

// Get current user's office transaction history
export const getMyOfficeTransactionHistory = async (): Promise<ItemTransaction[]> => {
  const response = await api.get("/distributions/my-office/history");
  return response.data;
};

// Get pending distributions for current user's office
export const getPendingDistributions = async (): Promise<ItemTransaction[]> => {
  const response = await api.get("/distributions/pending");
  return response.data;
};

// Confirm a distribution transaction
export const confirmTransaction = async (transactionId: number): Promise<ItemTransaction> => {
  const response = await api.post(`/distributions/${transactionId}/confirm`);
  return response.data;
};

// Reject a distribution transaction
export const rejectTransaction = async (transactionId: number, reason?: string): Promise<ItemTransaction> => {
  const response = await api.post(`/distributions/${transactionId}/reject`, { reason });
  return response.data;
};
