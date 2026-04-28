import { useState } from "react";
import {
  ItemRequestForm,
  ApprovalRequest,
  RejectionRequest,
  FulfillmentRequest,
  ConfirmationRequest,
  ItemRequest,
  useCreateItemRequest,
  useApproveRequest,
  useRejectRequest,
  useFulfillRequest,
  useConfirmReceipt,
} from "@/services/itemRequestService";

export interface ItemRequestLine {
  itemId: number;
  itemName?: string;
  quantity: number;
  rationale?: string;
}

const initialFormData: ItemRequestLine[] = [];

const initialApprovalData: ApprovalRequest = {
  approvedQuantity: 0,
};

const initialRejectionData: RejectionRequest = {
  remarks: "",
};

const initialFulfillmentData: FulfillmentRequest = {
  quantity: 0,
};

const initialConfirmationData: ConfirmationRequest = {
  remarks: "",
};

export function useRequisitionForm() {
  const [items, setItems] = useState<ItemRequestLine[]>(initialFormData);
  const [parentOfficeId, setParentOfficeId] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [approvalData, setApprovalData] = useState<ApprovalRequest>(initialApprovalData);
  const [rejectionData, setRejectionData] = useState<RejectionRequest>(initialRejectionData);
  const [fulfillmentData, setFulfillmentData] = useState<FulfillmentRequest>(initialFulfillmentData);
  const [confirmationData, setConfirmationData] = useState<ConfirmationRequest>(initialConfirmationData);
  const [selectedRequest, setSelectedRequest] = useState<ItemRequest | null>(null);

  const createMutation = useCreateItemRequest();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const fulfillMutation = useFulfillRequest();
  const confirmMutation = useConfirmReceipt();

  const addItem = (itemId: number, itemName: string, quantity: number) => {
    setItems(prev => [...prev, { itemId, itemName, quantity }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const replaceItems = (nextItems: ItemRequestLine[]) => {
    setItems(nextItems);
  };

  const validateCreateForm = (): boolean => {
    if (items.length === 0 || !parentOfficeId) {
      return false;
    }
    return items.every(item => item.quantity > 0);
  };

  const validateApprovalForm = (): boolean => {
    if (!selectedRequest || !approvalData.approvedQuantity) {
      return false;
    }
    return true;
  };

  const validateRejectionForm = (): boolean => {
    if (!selectedRequest || !rejectionData.remarks) {
      return false;
    }
    return true;
  };

  const validateFulfillmentForm = (): boolean => {
    if (!selectedRequest || !fulfillmentData.quantity || fulfillmentData.quantity <= 0) {
      return false;
    }
    const remainingQuantity = (selectedRequest.approvedQuantity || 0) - (selectedRequest.fulfilledQuantity || 0);
    if (fulfillmentData.quantity > remainingQuantity) {
      return false;
    }
    return true;
  };

  const resetCreateForm = () => {
    setItems(initialFormData);
    setParentOfficeId(0);
    setReason("");
  };

  const resetApprovalForm = () => {
    setApprovalData(initialApprovalData);
    setSelectedRequest(null);
  };

  const resetRejectionForm = () => {
    setRejectionData(initialRejectionData);
    setSelectedRequest(null);
  };

  const resetFulfillmentForm = () => {
    setFulfillmentData(initialFulfillmentData);
    setSelectedRequest(null);
  };

  const resetConfirmationForm = () => {
    setConfirmationData(initialConfirmationData);
    setSelectedRequest(null);
  };

  const prepareApprovalForm = (request: ItemRequest) => {
    setSelectedRequest(request);
    setApprovalData({
      approvedQuantity: request.requestedQuantity,
    });
  };

  const prepareRejectionForm = (request: ItemRequest) => {
    setSelectedRequest(request);
    setRejectionData(initialRejectionData);
  };

  const prepareFulfillmentForm = (request: ItemRequest) => {
    setSelectedRequest(request);
    const remainingQuantity = (request.approvedQuantity || 0) - (request.fulfilledQuantity || 0);
    setFulfillmentData({
      quantity: Math.floor(remainingQuantity),
    });
  };

  const prepareConfirmationForm = (request: ItemRequest) => {
    setSelectedRequest(request);
    setConfirmationData(initialConfirmationData);
  };

  const createRequest = async (): Promise<boolean> => {
    if (!validateCreateForm()) {
      throw new Error("Please add at least one item and select an office");
    }

    try {
      // Create multiple requests, one for each item
      const promises = items.map(item => {
        const requestData: ItemRequestForm = {
          item: { id: item.itemId },
          requestedQuantity: item.quantity,
          parentOffice: { id: parentOfficeId },
          reason: reason,
        };
        return createMutation.mutateAsync(requestData);
      });

      await Promise.all(promises);
      resetCreateForm();
      return true;
    } catch (error: any) {
      // Extract error message from axios response
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data 
        || error?.message 
        || "Failed to create requisition";
      throw new Error(errorMessage);
    }
  };

  const approveRequest = async (): Promise<boolean> => {
    if (!validateApprovalForm()) {
      throw new Error("Please enter approved quantity");
    }

    try {
      await approveMutation.mutateAsync({
        id: selectedRequest!.id,
        approval: approvalData,
      });
      resetApprovalForm();
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data 
        || error?.message 
        || "Failed to approve requisition";
      throw new Error(errorMessage);
    }
  };

  const rejectRequest = async (): Promise<boolean> => {
    if (!validateRejectionForm()) {
      throw new Error("Please enter rejection reason");
    }

    try {
      await rejectMutation.mutateAsync({
        id: selectedRequest!.id,
        rejection: rejectionData,
      });
      resetRejectionForm();
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data 
        || error?.message 
        || "Failed to reject requisition";
      throw new Error(errorMessage);
    }
  };

  const fulfillRequest = async (): Promise<boolean> => {
    if (!validateFulfillmentForm()) {
      throw new Error("Please enter valid fulfillment quantity");
    }

    try {
      await fulfillMutation.mutateAsync({
        id: selectedRequest!.id,
        fulfillment: fulfillmentData,
      });
      resetFulfillmentForm();
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data 
        || error?.message 
        || "Failed to fulfill requisition";
      throw new Error(errorMessage);
    }
  };

  const confirmReceipt = async (): Promise<boolean> => {
    if (!selectedRequest) {
      throw new Error("No request selected");
    }

    try {
      await confirmMutation.mutateAsync({
        id: selectedRequest.id,
        confirmation: confirmationData,
      });
      resetConfirmationForm();
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data 
        || error?.message 
        || "Failed to confirm receipt";
      throw new Error(errorMessage);
    }
  };

  return {
    items,
    parentOfficeId,
    setParentOfficeId,
    reason,
    setReason,
    addItem,
    removeItem,
    updateItemQuantity,
    replaceItems,
    approvalData,
    setApprovalData,
    rejectionData,
    setRejectionData,
    fulfillmentData,
    setFulfillmentData,
    confirmationData,
    setConfirmationData,
    selectedRequest,
    prepareApprovalForm,
    prepareRejectionForm,
    prepareFulfillmentForm,
    prepareConfirmationForm,
    createRequest,
    approveRequest,
    rejectRequest,
    fulfillRequest,
    confirmReceipt,
    setSelectedRequest,
    isCreating: createMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isFulfilling: fulfillMutation.isPending,
    isConfirming: confirmMutation.isPending,
  };
}
