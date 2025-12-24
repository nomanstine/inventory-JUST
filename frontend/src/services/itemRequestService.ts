import api from "@/lib/api";

export interface ItemRequest {
  id: number;
  requestDate: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  fulfilledQuantity?: number;
  status: string;
  priority?: string;
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
  };
  approvedBy?: {
    id: number;
    username: string;
    name?: string;
  };
  fulfilledBy?: {
    id: number;
    username: string;
    name?: string;
  };
  remarks?: string;
  approvalRemarks?: string;
  rejectionReason?: string;
}

export interface ItemRequestForm {
  itemId: number;
  requestedQuantity: number;
  parentOfficeId: number;
  priority?: string;
  remarks?: string;
}

export interface ApprovalRequest {
  approvedQuantity: number;
  approvalRemarks?: string;
}

export interface FulfillmentRequest {
  fulfilledQuantity: number;
  itemInstanceIds: number[];
}

export interface RejectionRequest {
  rejectionReason: string;
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
