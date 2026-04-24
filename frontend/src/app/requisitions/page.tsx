"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { consumeRequisitionDraft } from "@/lib/requisitionDraft";

import { 
  PageLayout, 
  Header 
} from "@/components/page";

import { FilterGroup as Filter } from "@/components/filters";
import { SearchGroup as Search } from "@/components/search";
import { PaginationGroup as Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  useMyRequests,
  useIncomingRequests,
  useApprovedRequests,
  useFulfilledRequests,
  useHistoryRequests,
  useRequisitionSuggestions,
  ItemRequest,
} from "@/services/itemRequestService";
import { useItems } from "@/services/itemService";
import { useOffices } from "@/services/officeService";
import { CreateRequestDialog } from "./components/CreateRequestDialog";
import { ApproveRequestDialog } from "./components/ApproveRequestDialog";
import { RejectRequestDialog } from "./components/RejectRequestDialog";
import { FulfillRequestDialog } from "./components/FulfillRequestDialog";
import { ConfirmReceiptDialog } from "./components/ConfirmReceiptDialog";
import { RequisitionsTable } from "./components/RequisitionsTable";
import { useRequisitionForm } from "./hooks/useRequisitionForm";

const searchConfig = {
  placeholder: "Search by item name, office...",
  searchKeys: ["item.name", "requestingOffice.name", "parentOffice.name", "status"],
};

const filterConfig = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "All", value: "all" },
      { label: "Pending", value: "PENDING" },
      { label: "Approved", value: "APPROVED" },
      { label: "Rejected", value: "REJECTED" },
      { label: "Fulfilled", value: "FULFILLED" },
      { label: "Confirmed", value: "CONFIRMED" },
      { label: "Partially Fulfilled", value: "PARTIALLY_FULFILLED" },
      { label: "Cancelled", value: "CANCELLED" },
    ],
  },
];

const normalizeRole = (role?: string) => (role || "").replace(/^ROLE_/, "").toUpperCase();

export default function RequisitionsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'my-requests' | 'incoming' | 'approved' | 'fulfilled' | 'history'>('my-requests');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [aiUnavailableHint, setAiUnavailableHint] = useState<string>("");
  const autoSuggestKeyRef = useRef<string>("");

  const { data: myRequests = [], isLoading: loadingMyRequests } = useMyRequests();
  const { data: incomingRequests = [], isLoading: loadingIncoming } = useIncomingRequests();
  const { data: approvedRequests = [], isLoading: loadingApproved } = useApprovedRequests();
  const { data: fulfilledRequests = [], isLoading: loadingFulfilled } = useFulfilledRequests();
  const { data: historyRequests = [], isLoading: loadingHistory } = useHistoryRequests();
  const { data: items = [] } = useItems();
  const { data: offices = [] } = useOffices();
  
  const {
    items: requestItems,
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
    selectedRequest,
    prepareApprovalForm,
    prepareRejectionForm,
    prepareFulfillmentForm,
    createRequest,
    approveRequest,
    rejectRequest,
    fulfillRequest,
    confirmationData,
    setConfirmationData,
    prepareConfirmationForm,
    confirmReceipt,
    isCreating,
    isApproving,
    isRejecting,
    isFulfilling,
    isConfirming,
  } = useRequisitionForm();
  const suggestionMutation = useRequisitionSuggestions();

  const currentData = activeTab === 'my-requests' ? myRequests : 
                      activeTab === 'incoming' ? incomingRequests : 
                      activeTab === 'approved' ? approvedRequests : 
                      activeTab === 'fulfilled' ? fulfilledRequests :
                      historyRequests;
  const isLoading = activeTab === 'my-requests' ? loadingMyRequests : 
                    activeTab === 'incoming' ? loadingIncoming : 
                    activeTab === 'approved' ? loadingApproved : 
                    activeTab === 'fulfilled' ? loadingFulfilled :
                    loadingHistory;

  const [searchedData, setSearchedData] = useState<ItemRequest[]>(currentData);
  const [filteredData, setFilteredData] = useState<ItemRequest[]>(currentData);
  const [paginatedData, setPaginatedData] = useState<ItemRequest[]>(currentData);

  // Reset search/filter/pagination states when currentData changes (tab switch or data refresh)
  useEffect(() => {
    setSearchedData(currentData);
    setFilteredData(currentData);
    setPaginatedData(currentData);
  }, [currentData]);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Requisitions" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view requisitions</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  const handleCreateRequest = async () => {
    try {
      await createRequest();
      toast.success(`Successfully created ${requestItems.length} requisition${requestItems.length !== 1 ? 's' : ''}`);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create request:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create request";
      toast.error(errorMessage);
    }
  };

  const handleApprove = async () => {
    try {
      await approveRequest();
      toast.success("Requisition approved successfully");
      setShowApproveDialog(false);
    } catch (error) {
      console.error("Failed to approve request:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to approve request";
      toast.error(errorMessage);
    }
  };

  const handleReject = async () => {
    try {
      await rejectRequest();
      toast.success("Requisition rejected");
      setShowRejectDialog(false);
    } catch (error) {
      console.error("Failed to reject request:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reject request";
      toast.error(errorMessage);
    }
  };

  const handleFulfill = async () => {
    try {
      await fulfillRequest();
      toast.success("Requisition fulfilled successfully");
      setShowFulfillDialog(false);
    } catch (error) {
      console.error("Failed to fulfill request:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fulfill request";
      toast.error(errorMessage);
    }
  };

  const openApproveDialog = (request: ItemRequest) => {
    prepareApprovalForm(request);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (request: ItemRequest) => {
    prepareRejectionForm(request);
    setShowRejectDialog(true);
  };

  const openFulfillDialog = (request: ItemRequest) => {
    prepareFulfillmentForm(request);
    setShowFulfillDialog(true);
  };

  const openConfirmDialog = (request: ItemRequest) => {
    prepareConfirmationForm(request);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    try {
      await confirmReceipt();
      toast.success("Receipt confirmed successfully");
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Failed to confirm receipt:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to confirm receipt";
      toast.error(errorMessage);
    }
  };

  const handleSuggestRequest = useCallback(async () => {
    try {
      if (!parentOfficeId) {
        throw new Error("Please select an office first");
      }

      const result = await suggestionMutation.mutateAsync({
        parentOfficeId,
        reason,
      });

      if (!result.suggestions || result.suggestions.length === 0) {
        throw new Error(result.warning || "AI returned no usable suggestions");
      }

      replaceItems(
        result.suggestions.map((line) => ({
          itemId: line.itemId,
          itemName: line.itemName,
          quantity: line.quantity,
          rationale: line.rationale,
        }))
      );

      if (result.summary) {
        toast.success(result.summary);
      }
      setAiUnavailableHint("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch suggestions";
      const normalized = message.toLowerCase();
      if (normalized.includes("api key") || normalized.includes("disabled")) {
        setAiUnavailableHint("AI suggestions are unavailable right now. Ask an admin to configure backend AI_REQUISITION_API_KEY.");
      }
      toast.error(message);
    }
  }, [parentOfficeId, reason, replaceItems, suggestionMutation]);

  const isAdmin = normalizeRole(user?.role) === 'ADMIN';
  const currentUserOfficeId = user?.officeId ? parseInt(user.officeId) : 0;

  const currentOffice = useMemo(
    () => offices.find((office) => office.id === currentUserOfficeId),
    [offices, currentUserOfficeId]
  );

  const officeOptionsForRequisition = useMemo(() => {
    const parentOfficeId = currentOffice?.parent?.id;
    if (parentOfficeId) {
      const parentOffice = offices.find((office) => office.id === parentOfficeId);
      return parentOffice ? [parentOffice] : [];
    }
    return offices.filter((office) => office.id !== currentUserOfficeId);
  }, [offices, currentOffice, currentUserOfficeId]);

  const isOfficeSelectionLocked = officeOptionsForRequisition.length === 1;

  useEffect(() => {
    if (!showCreateDialog || officeOptionsForRequisition.length !== 1) {
      return;
    }
    const onlyOfficeId = officeOptionsForRequisition[0].id;
    if (parentOfficeId !== onlyOfficeId) {
      setParentOfficeId(onlyOfficeId);
    }
  }, [showCreateDialog, officeOptionsForRequisition, parentOfficeId, setParentOfficeId]);

  useEffect(() => {
    if (!showCreateDialog || !isAdmin || !parentOfficeId) {
      return;
    }
    if (suggestionMutation.isPending || requestItems.length > 0) {
      return;
    }

    const key = `${parentOfficeId}`;
    if (autoSuggestKeyRef.current === key) {
      return;
    }
    autoSuggestKeyRef.current = key;

    void handleSuggestRequest();
  }, [
    showCreateDialog,
    isAdmin,
    parentOfficeId,
    requestItems.length,
    suggestionMutation.isPending,
    handleSuggestRequest,
  ]);

  useEffect(() => {
    if (!showCreateDialog) {
      autoSuggestKeyRef.current = "";
    }
  }, [showCreateDialog]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const draft = consumeRequisitionDraft();
    if (!draft) {
      return;
    }

    setParentOfficeId(draft.parentOfficeId);
    setReason(draft.reason || "");
    replaceItems(
      draft.items.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        rationale: item.rationale,
      }))
    );
    setShowCreateDialog(true);
    toast.success("Dashboard suggestions loaded into requisition draft");
  }, [isAdmin, replaceItems, setParentOfficeId, setReason]);

  return (
    <>
      <PageLayout
        header={
          <Header 
            title="Requisitions" 
            subtitle={isMobile ? "" : "Manage item requisitions between offices"}
            actions={
              isAdmin ? (
                <Button onClick={() => setShowCreateDialog(true)} size={isMobile ? "sm" : "default"}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isMobile ? "New" : "New Requisition"}
                </Button>
              ) : null
            }
          />
        }
        body={
          <div className="space-y-4">
            {/* Tabs */}
            <div className={`flex gap-2 border-b ${isMobile ? 'overflow-x-auto pb-2 -mx-4 px-4' : ''}`}>
              <button
                className={`${isMobile ? 'px-3 py-2 text-sm whitespace-nowrap' : 'px-4 py-2'} font-medium transition-colors ${
                  activeTab === 'my-requests'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('my-requests')}
              >
                My Requests {!isMobile && `(${myRequests.length})`}
              </button>
              <button
                className={`${isMobile ? 'px-3 py-2 text-sm whitespace-nowrap' : 'px-4 py-2'} font-medium transition-colors ${
                  activeTab === 'incoming'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('incoming')}
              >
                Incoming {!isMobile && `(${incomingRequests.length})`}
              </button>
              <button
                className={`${isMobile ? 'px-3 py-2 text-sm whitespace-nowrap' : 'px-4 py-2'} font-medium transition-colors ${
                  activeTab === 'approved'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('approved')}
              >
                Approved {!isMobile && `(${approvedRequests.length})`}
              </button>
              <button
                className={`${isMobile ? 'px-3 py-2 text-sm whitespace-nowrap' : 'px-4 py-2'} font-medium transition-colors ${
                  activeTab === 'fulfilled'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('fulfilled')}
              >
                Fulfilled {!isMobile && `(${fulfilledRequests.length})`}
              </button>
              <button
                className={`${isMobile ? 'px-3 py-2 text-sm whitespace-nowrap' : 'px-4 py-2'} font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('history')}
              >
                History {!isMobile && `(${historyRequests.length})`}
              </button>
            </div>

            <Search 
              config={searchConfig} 
              data={currentData} 
              onSearchedData={setSearchedData} 
            />
            <Filter 
              filters={filterConfig} 
              data={searchedData} 
              onFilteredData={setFilteredData} 
            />
            <RequisitionsTable 
              data={paginatedData}
              activeTab={activeTab}
              isLoading={isLoading}
              isAdmin={isAdmin}
              onApprove={openApproveDialog}
              onReject={openRejectDialog}
              onFulfill={openFulfillDialog}
              onConfirm={openConfirmDialog}
            />
            <Pagination 
              data={filteredData} 
              onPaginatedData={setPaginatedData} 
            />
          </div>
        }
      />
      
      <CreateRequestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        items={items}
        offices={officeOptionsForRequisition}
        currentUserOfficeId={currentUserOfficeId || undefined}
        onSubmit={handleCreateRequest}
        isSubmitting={isCreating}
        requestItems={requestItems}
        parentOfficeId={parentOfficeId}
        reason={reason}
        onParentOfficeChange={setParentOfficeId}
        onReasonChange={setReason}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateItemQuantity}
        onSuggest={handleSuggestRequest}
        isSuggesting={suggestionMutation.isPending}
        aiUnavailableHint={aiUnavailableHint}
        lockOfficeSelection={isOfficeSelectionLocked}
      />
      
      <ApproveRequestDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        request={selectedRequest}
        approvalData={approvalData}
        onApprovalDataChange={setApprovalData}
        onSubmit={handleApprove}
        isSubmitting={isApproving}
      />
      
      <RejectRequestDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        request={selectedRequest}
        rejectionData={rejectionData}
        onRejectionDataChange={setRejectionData}
        onSubmit={handleReject}
        isSubmitting={isRejecting}
      />
      
      <FulfillRequestDialog
        open={showFulfillDialog}
        onOpenChange={setShowFulfillDialog}
        request={selectedRequest}
        fulfillmentData={fulfillmentData}
        onFulfillmentDataChange={setFulfillmentData}
        onSubmit={handleFulfill}
        isSubmitting={isFulfilling}
      />

      <ConfirmReceiptDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        request={selectedRequest}
        remarks={confirmationData.remarks || ""}
        setRemarks={(remarks) => setConfirmationData({ remarks })}
        onConfirm={handleConfirm}
        isConfirming={isConfirming}
      />
    </>
  );
}
