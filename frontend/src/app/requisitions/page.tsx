"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

export default function RequisitionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-requests' | 'incoming' | 'approved' | 'fulfilled' | 'history'>('my-requests');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  return (
    <>
      <PageLayout
        header={
          <Header 
            title="Requisitions" 
            subtitle="Manage item requisitions between offices"
            actions={
              isAdmin ? (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Requisition
                </Button>
              ) : null
            }
          />
        }
        body={
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'my-requests'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('my-requests')}
              >
                My Requests ({myRequests.length})
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'incoming'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('incoming')}
              >
                Incoming Requests ({incomingRequests.length})
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'approved'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('approved')}
              >
                Approved ({approvedRequests.length})
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'fulfilled'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('fulfilled')}
              >
                Fulfilled ({fulfilledRequests.length})
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('history')}
              >
                History ({historyRequests.length})
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
        offices={offices}
        currentUserOfficeId={user?.officeId ? parseInt(user.officeId) : undefined}
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
