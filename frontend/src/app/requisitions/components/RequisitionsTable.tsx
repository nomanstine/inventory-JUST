import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, FileX, PackageCheck, ClipboardCheck } from "lucide-react";
import { ItemRequest } from "@/services/itemRequestService";
import { getStatusColor, formatStatus } from "../utils/statusUtils";

interface RequisitionsTableProps {
  data: ItemRequest[];
  activeTab: 'my-requests' | 'incoming' | 'approved' | 'fulfilled' | 'history';
  isLoading: boolean;
  isAdmin: boolean;
  onApprove: (request: ItemRequest) => void;
  onReject: (request: ItemRequest) => void;
  onFulfill: (request: ItemRequest) => void;
  onConfirm: (request: ItemRequest) => void;
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
    </TableRow>
  );
}

function EmptyState({ activeTab }: { activeTab: 'my-requests' | 'incoming' | 'approved' | 'fulfilled' | 'history' }) {
  const messages = {
    'my-requests': "No requisitions found. Create a new requisition to request items from other offices.",
    'incoming': "No incoming requisitions. Requests from other offices will appear here.",
    'approved': "No approved requisitions. Approved requests that need fulfillment will appear here.",
    'fulfilled': "No fulfilled requisitions. Completed requisitions will appear here.",
    'history': "No requisition history found. All past and present requisitions will appear here."
  };

  return (
    <TableRow>
      <TableCell colSpan={8} className="h-64">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <FileX className="h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-500 max-w-md">{messages[activeTab]}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function RequisitionsTable({
  data,
  activeTab,
  isLoading,
  isAdmin,
  onApprove,
  onReject,
  onFulfill,
  onConfirm,
}: RequisitionsTableProps) {
  const showApproveRejectActions = (request: ItemRequest) => {
    return isAdmin && activeTab === 'incoming' && request.status === 'PENDING';
  };

  const showFulfillAction = (request: ItemRequest) => {
    return isAdmin && activeTab === 'approved' && 
           (request.status === 'APPROVED' || request.status === 'PARTIALLY_FULFILLED');
  };

  const showConfirmAction = (request: ItemRequest) => {
    return isAdmin && activeTab === 'fulfilled' && (request.status === 'FULFILLED' || request.status === 'PARTIALLY_FULFILLED');
  };

  return (
    <Table>
      <TableCaption>
        {!isLoading && `Total: ${data.length} requisition${data.length !== 1 ? 's' : ''}`}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Item</TableHead>
          {activeTab === 'history' ? (
            <>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
            </>
          ) : activeTab === 'my-requests' || activeTab === 'approved' || activeTab === 'fulfilled' ? (
            <TableHead>Requested To</TableHead>
          ) : (
            <TableHead>Requested By</TableHead>
          )}
          <TableHead>Quantity</TableHead>
          <TableHead>Approved</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <>
            <LoadingRow />
            <LoadingRow />
            <LoadingRow />
          </>
        ) : data.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.id}</TableCell>
              <TableCell>{request.item.name}</TableCell>
              {activeTab === 'history' ? (
                <>
                  <TableCell>{request.parentOffice.name}</TableCell>
                  <TableCell>{request.requestingOffice.name}</TableCell>
                </>
              ) : activeTab === 'my-requests' || activeTab === 'approved' || activeTab === 'fulfilled' ? (
                <TableCell>{request.parentOffice.name}</TableCell>
              ) : (
                <TableCell>{request.requestingOffice.name}</TableCell>
              )}
              <TableCell>{request.requestedQuantity}</TableCell>
              <TableCell>{request.approvedQuantity ?? '-'}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(request.status)}>
                  {formatStatus(request.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(request.requestedDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {showApproveRejectActions(request) && (
                    <>
                      <Button 
                        size="sm"
                        variant="default"
                        onClick={() => onApprove(request)}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(request)}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {showFulfillAction(request) && (
                    <Button 
                      size="sm"
                      variant="default"
                      onClick={() => onFulfill(request)}
                      className="flex items-center gap-1"
                    >
                      <PackageCheck className="h-4 w-4" />
                      Fulfill
                    </Button>
                  )}
                  {showConfirmAction(request) && (
                    <Button 
                      size="sm"
                      variant="default"
                      onClick={() => onConfirm(request)}
                      className="flex items-center gap-1"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Confirm Receipt
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
