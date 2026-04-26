import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ItemRequest {
  id: number;
  requestedDate: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  fulfilledQuantity?: number;
  status: string;
  reason?: string;
  remarks?: string;
  confirmationRemarks?: string;
  approvedDate?: string;
  rejectedDate?: string;
  fulfilledDate?: string;
  confirmedDate?: string;
  requestingOffice: {
    id: number;
    name: string;
    code?: string;
  };
  parentOffice: {
    id: number;
    name: string;
    code?: string;
  };
  item: {
    id: number;
    name: string;
  };
  requestedBy: {
    id: number;
    username: string;
    name?: string;
    avatarUrl?: string | null;
  };
  approvedBy?: {
    id: number;
    username: string;
    name?: string;
    avatarUrl?: string | null;
  };
  confirmedBy?: {
    id: number;
    username: string;
    name?: string;
    avatarUrl?: string | null;
  };
}

export interface ItemRequestForm {
  item: {
    id: number;
  };
  requestedQuantity: number;
  parentOffice: {
    id: number;
  };
  reason?: string;
}

export interface ApprovalRequest {
  approvedQuantity: number;
}

export interface FulfillmentRequest {
  quantity: number;
}

export interface RejectionRequest {
  remarks: string;
}

export interface ConfirmationRequest {
  remarks?: string;
}

export interface RequisitionSuggestionRequest {
  parentOfficeId: number;
  reason?: string;
}

export interface RequisitionSuggestionLine {
  itemId: number;
  itemName: string;
  quantity: number;
  rationale?: string;
}

export interface RequisitionSuggestionResponse {
  summary: string;
  source: string;
  warning?: string;
  suggestions: RequisitionSuggestionLine[];
}

// Create a new item request
export const createItemRequest = async (request: ItemRequestForm): Promise<ItemRequest> => {
  const response = await api.post("/item-requests", request);
  return response.data;
};

// Get all item requests for current user's office
export const getItemRequests = async (): Promise<ItemRequest[]> => {
  const response = await api.get("/item-requests");
  return response.data;
};

// Get item request by ID
export const getItemRequestById = async (id: number): Promise<ItemRequest> => {
  const response = await api.get(`/item-requests/${id}`);
  return response.data;
};

// Get requests by office
export const getRequestsByOffice = async (officeId: number): Promise<ItemRequest[]> => {
  const response = await api.get(`/item-requests/office/${officeId}`);
  return response.data;
};

// Approve a request
export const approveRequest = async (id: number, approval: ApprovalRequest): Promise<ItemRequest> => {
  const response = await api.put(`/item-requests/${id}/approve`, approval);
  return response.data;
};

// Fulfill a request
export const fulfillRequest = async (id: number, fulfillment: FulfillmentRequest): Promise<ItemRequest> => {
  const response = await api.put(`/item-requests/${id}/fulfill`, fulfillment);
  return response.data;
};

// Reject a request
export const rejectRequest = async (id: number, rejection: RejectionRequest): Promise<ItemRequest> => {
  const response = await api.put(`/item-requests/${id}/reject`, rejection);
  return response.data;
};

// Confirm receipt of fulfilled request
export const confirmReceipt = async (id: number, confirmation: ConfirmationRequest): Promise<ItemRequest> => {
  const response = await api.put(`/item-requests/${id}/confirm`, confirmation);
  return response.data;
};

export const getRequisitionSuggestions = async (
  payload: RequisitionSuggestionRequest,
): Promise<RequisitionSuggestionResponse> => {
  try {
    const response = await api.post("/item-requests/suggestions", payload);
    return response.data;
  } catch (error: any) {
    const responseData = error?.response?.data;
    const message =
      (typeof responseData === "string" && responseData.trim()) ||
      responseData?.message ||
      error?.message ||
      "Failed to fetch requisition suggestions";
    throw new Error(message);
  }
};

// Get incoming requests (requests TO current user's office)
export const getIncomingRequests = async (): Promise<ItemRequest[]> => {
  const response = await api.get("/item-requests/incoming");
  return response.data;
};

// Get my requests (requests FROM current user's office)
export const getMyRequests = async (): Promise<ItemRequest[]> => {
  const response = await api.get("/item-requests/my-requests");
  return response.data;
};

// Get approved requests (approved but not yet fulfilled)
export const getApprovedRequests = async (): Promise<ItemRequest[]> => {
  const response = await api.get("/item-requests/approved");
  return response.data;
};

// Get fulfilled requests (fulfilled or partially fulfilled)
export const getFulfilledRequests = async (): Promise<ItemRequest[]> => {
  const response = await api.get("/item-requests/fulfilled");
  return response.data;
};

// Get history (all requests for current office)
export const getHistoryRequests = async (): Promise<ItemRequest[]> => {
  const response = await api.get("/item-requests/history");
  return response.data;
};

// React Query Hooks
export const useItemRequests = () => {
  return useQuery({
    queryKey: ['itemRequests'],
    queryFn: getItemRequests,
  });
};

export const useItemRequest = (id: number) => {
  return useQuery({
    queryKey: ['itemRequests', id],
    queryFn: () => getItemRequestById(id),
    enabled: !!id,
  });
};

export const useRequestsByOffice = (officeId: number) => {
  return useQuery({
    queryKey: ['itemRequests', 'office', officeId],
    queryFn: () => getRequestsByOffice(officeId),
    enabled: !!officeId,
  });
};

export const useIncomingRequests = () => {
  return useQuery({
    queryKey: ['itemRequests', 'incoming'],
    queryFn: getIncomingRequests,
  });
};

export const useMyRequests = () => {
  return useQuery({
    queryKey: ['itemRequests', 'my-requests'],
    queryFn: getMyRequests,
  });
};

export const useApprovedRequests = () => {
  return useQuery({
    queryKey: ['itemRequests', 'approved'],
    queryFn: getApprovedRequests,
  });
};

export const useFulfilledRequests = () => {
  return useQuery({
    queryKey: ['itemRequests', 'fulfilled'],
    queryFn: getFulfilledRequests,
  });
};

export const useHistoryRequests = () => {
  return useQuery({
    queryKey: ['itemRequests', 'history'],
    queryFn: getHistoryRequests,
  });
};

export const useCreateItemRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItemRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemRequests'] });
    },
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approval }: { id: number; approval: ApprovalRequest }) =>
      approveRequest(id, approval),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemRequests'] });
    },
  });
};

export const useFulfillRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fulfillment }: { id: number; fulfillment: FulfillmentRequest }) =>
      fulfillRequest(id, fulfillment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemRequests'] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejection }: { id: number; rejection: RejectionRequest }) =>
      rejectRequest(id, rejection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemRequests'] });
    },
  });
};

export const useConfirmReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmation }: { id: number; confirmation: ConfirmationRequest }) =>
      confirmReceipt(id, confirmation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemRequests'] });
    },
  });
};

export const useRequisitionSuggestions = () => {
  return useMutation({
    mutationFn: getRequisitionSuggestions,
  });
};
