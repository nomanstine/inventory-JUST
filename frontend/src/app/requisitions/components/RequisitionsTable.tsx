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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, FileX, PackageCheck, ClipboardCheck, User as UserIcon } from "lucide-react";
import { ItemRequest } from "@/services/itemRequestService";
import { getStatusColor, formatStatus } from "../utils/statusUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface RequisitionsTableProps {
  data: ItemRequest[];
  activeTab: 'my-requests' | 'incoming' | 'approved' | 'fulfilled' | 'history';
  isLoading: boolean;
  isAdmin: boolean;
  onApprove: (request: ItemRequest) => void;
  onReject: (request: ItemRequest) => void;
  onFulfill: (request: ItemRequest) => void;
  onConfirm: (request: ItemRequest) => void;
  onViewDetails: (request: ItemRequest) => void;
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

function MobileLoadingCard() {
  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
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
    <div className="flex flex-col items-center justify-center text-center space-y-3 py-12 px-4">
      <FileX className="h-12 w-12 text-gray-400" />
      <p className="text-sm text-gray-500 max-w-md">{messages[activeTab]}</p>
    </div>
  );
}

function MobileRequisitionCard({ 
  request, 
  activeTab,
  isAdmin,
  onApprove, 
  onReject, 
  onFulfill, 
  onConfirm,
  onViewDetails
}: { 
  request: ItemRequest;
  activeTab: 'my-requests' | 'incoming' | 'approved' | 'fulfilled' | 'history';
  isAdmin: boolean;
  onApprove: (request: ItemRequest) => void;
  onReject: (request: ItemRequest) => void;
  onFulfill: (request: ItemRequest) => void;
  onConfirm: (request: ItemRequest) => void;
  onViewDetails: (request: ItemRequest) => void;
}) {
  const showApproveRejectActions = isAdmin && activeTab === 'incoming' && request.status === 'PENDING';
  const showFulfillAction = isAdmin && activeTab === 'approved' && 
    (request.status === 'APPROVED' || request.status === 'PARTIALLY_FULFILLED');
  const showConfirmAction = isAdmin && activeTab === 'fulfilled' && 
    (request.status === 'FULFILLED' || request.status === 'PARTIALLY_FULFILLED');

  return (
    <Card className="mb-3 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => onViewDetails(request)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {request.item.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">ID: {request.id}</p>
          </div>
          <Badge className={getStatusColor(request.status)}>
            {formatStatus(request.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {activeTab === 'history' ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium">{request.parentOffice.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-medium">{request.requestingOffice.name}</p>
              </div>
            </>
          ) : activeTab === 'my-requests' || activeTab === 'approved' || activeTab === 'fulfilled' ? (
            <div>
              <p className="text-xs text-muted-foreground">Requested To</p>
              <p className="font-medium">{request.parentOffice.name}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Requested By</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={request.requestedBy.avatarUrl || ""} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(request.requestedBy.name, request.requestedBy.username)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{request.requestingOffice.name}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="font-medium">{request.requestedQuantity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="font-medium">{request.approvedQuantity ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium">
              {new Date(request.requestedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {(showApproveRejectActions || showFulfillAction || showConfirmAction) && (
          <div className="flex flex-col gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            {showApproveRejectActions && (
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="default"
                  onClick={() => onApprove(request)}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(request)}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
            {showFulfillAction && (
              <Button 
                size="sm"
                variant="default"
                onClick={() => onFulfill(request)}
                className="w-full flex items-center justify-center gap-1"
              >
                <PackageCheck className="h-4 w-4" />
                Fulfill
              </Button>
            )}
            {showConfirmAction && (
              <Button 
                size="sm"
                variant="default"
                onClick={() => onConfirm(request)}
                className="w-full flex items-center justify-center gap-1"
              >
                <ClipboardCheck className="h-4 w-4" />
                Confirm Receipt
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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
  onViewDetails,
}: RequisitionsTableProps) {
  const isMobile = useIsMobile();
  
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

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-2">
        {isLoading ? (
          <>
            <MobileLoadingCard />
            <MobileLoadingCard />
            <MobileLoadingCard />
          </>
        ) : data.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <>
            {data.map((request) => (
              <MobileRequisitionCard
                key={request.id}
                request={request}
                activeTab={activeTab}
                isAdmin={isAdmin}
                onApprove={onApprove}
                onReject={onReject}
                onFulfill={onFulfill}
                onConfirm={onConfirm}
                onViewDetails={onViewDetails}
              />
            ))}
            <div className="text-center text-sm text-muted-foreground py-2">
              Total: {data.length} requisition{data.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop view
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
          <TableRow>
            <TableCell colSpan={8} className="h-64">
              <EmptyState activeTab={activeTab} />
            </TableCell>
          </TableRow>
        ) : (
          data.map((request) => (
            <TableRow 
              key={request.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onViewDetails(request)}
            >
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
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{request.requestingOffice.name}</span>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={request.requestedBy.avatarUrl || ""} />
                        <AvatarFallback className="text-[8px]">
                          {getInitials(request.requestedBy.name, request.requestedBy.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{request.requestedBy.name || request.requestedBy.username}</span>
                    </div>
                  </div>
                </TableCell>
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
              <TableCell onClick={(e) => e.stopPropagation()}>
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
