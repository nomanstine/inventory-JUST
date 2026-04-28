import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ItemRequest } from "@/services/itemRequestService";
import { getStatusColor, formatStatus } from "../utils/statusUtils";
import { Check, X, PackageCheck, ClipboardCheck, Calendar, Building, User, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface RequisitionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ItemRequest | null;
  isAdmin: boolean;
  currentUserOfficeId: number;
  activeTab: string;
  onApprove: (request: ItemRequest) => void;
  onReject: (request: ItemRequest) => void;
  onFulfill: (request: ItemRequest) => void;
  onConfirm: (request: ItemRequest) => void;
}

export function RequisitionDetailsDialog({
  open,
  onOpenChange,
  request,
  isAdmin,
  currentUserOfficeId,
  activeTab,
  onApprove,
  onReject,
  onFulfill,
  onConfirm,
}: RequisitionDetailsDialogProps) {
  if (!request) return null;

  const isTargetOffice = request.parentOffice.id === currentUserOfficeId;
  const isRequestingOffice = request.requestingOffice.id === currentUserOfficeId;

  const showApproveRejectActions = isAdmin && isTargetOffice && request.status === 'PENDING';
  const showFulfillAction = isAdmin && isTargetOffice && (request.status === 'APPROVED' || request.status === 'PARTIALLY_FULFILLED');
  const showConfirmAction = isRequestingOffice && (request.status === 'FULFILLED' || request.status === 'PARTIALLY_FULFILLED');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Requisition Details</DialogTitle>
            <Badge className={getStatusColor(request.status)}>
              {formatStatus(request.status)}
            </Badge>
          </div>
          <DialogDescription>
            Detailed information about requisition #{request.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <PackageCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Item Name</p>
                  <p className="text-sm text-muted-foreground">{request.item.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Quantity</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Requested</p>
                      <p className="text-sm">{request.requestedQuantity}</p>
                    </div>
                    {request.status !== 'PENDING' && request.approvedQuantity !== undefined && request.approvedQuantity !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Approved</p>
                        <p className="text-sm font-medium">{request.approvedQuantity}</p>
                      </div>
                    )}
                    {(request.status === 'FULFILLED' || request.status === 'PARTIALLY_FULFILLED' || request.status === 'CONFIRMED') && (
                      <div>
                        <p className="text-xs text-muted-foreground">Fulfilled</p>
                        <p className="text-sm font-medium text-blue-600">{request.fulfilledQuantity || 0}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Requested Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(request.requestedDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Offices</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Requested From</p>
                      <p className="text-sm font-medium">{request.requestingOffice.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Requested To</p>
                      <p className="text-sm font-medium">{request.parentOffice.name}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Requested By</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={request.requestedBy.avatarUrl || ""} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(request.requestedBy.name, request.requestedBy.username)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">
                      {request.requestedBy.name || request.requestedBy.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Requester Reason</p>
              <div className="bg-muted p-3 rounded-md min-h-[60px]">
                <p className="text-sm text-muted-foreground italic">
                  "{request.reason || "No reason provided."}"
                </p>
              </div>
            </div>
            {(request.remarks || request.status === 'REJECTED' || request.status === 'APPROVED' || request.status === 'FULFILLED' || request.status === 'PARTIALLY_FULFILLED' || request.status === 'CONFIRMED') && (
              <div>
                <p className="text-sm font-medium mb-2">Admin Remarks / Notes</p>
                <div className="bg-muted p-3 rounded-md min-h-[60px]">
                  <p className="text-sm text-muted-foreground italic">
                    "{request.remarks || "No remarks provided."}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {(request.status === 'CONFIRMED' && (request.confirmedBy || request.confirmedDate)) && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
                Confirmation Details
              </p>
              <div className="flex items-center gap-3">
                {request.confirmedBy && (
                  <Avatar className="h-8 w-8 ring-2 ring-white">
                    <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                      {getInitials(request.confirmedBy.name || "", request.confirmedBy.username)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    Received and Confirmed
                    {request.confirmedBy && ` by ${request.confirmedBy.name || request.confirmedBy.username}`}
                  </p>
                  <p className="text-xs text-indigo-600">
                    {new Date(request.confirmedDate || "").toLocaleString()}
                  </p>
                  {request.confirmationRemarks && (
                    <p className="text-xs mt-2 text-indigo-800 italic">"{request.confirmationRemarks}"</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(request.status !== 'PENDING' && (request.approvedBy || request.approvedDate || request.rejectedDate)) && (
            <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {request.status === 'REJECTED' ? 'Rejection Details' : 'Approval Details'}
              </p>
              <div className="flex items-center gap-3">
                {request.approvedBy && (
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(request.approvedBy.name || "", request.approvedBy.username)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {request.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                    {request.approvedBy && ` by ${request.approvedBy.name || request.approvedBy.username}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.approvedDate || request.rejectedDate || "").toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            {showApproveRejectActions && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    onReject(request);
                    onOpenChange(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button 
                  onClick={() => {
                    onApprove(request);
                    onOpenChange(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {showFulfillAction && (
              <Button 
                onClick={() => {
                  onFulfill(request);
                  onOpenChange(false);
                }}
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Fulfill
              </Button>
            )}
            {showConfirmAction && (
              <Button 
                onClick={() => {
                  onConfirm(request);
                  onOpenChange(false);
                }}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Confirm Receipt
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
