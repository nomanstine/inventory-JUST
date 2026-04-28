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
  activeTab,
  onApprove,
  onReject,
  onFulfill,
  onConfirm,
}: RequisitionDetailsDialogProps) {
  if (!request) return null;

  const showApproveRejectActions = isAdmin && request.status === 'PENDING';
  const showFulfillAction = isAdmin && (request.status === 'APPROVED' || request.status === 'PARTIALLY_FULFILLED');
  const showConfirmAction = (request.status === 'FULFILLED' || request.status === 'PARTIALLY_FULFILLED');

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
                    {request.approvedQuantity !== undefined && request.approvedQuantity !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Approved</p>
                        <p className="text-sm">{request.approvedQuantity}</p>
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
                      <p className="text-xs text-muted-foreground">Requesting Office</p>
                      <p className="text-sm">{request.requestingOffice.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Requested From</p>
                      <p className="text-sm">{request.parentOffice.name}</p>
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
            {(request.remarks || request.status === 'REJECTED' || request.status === 'APPROVED') && (
              <div>
                <p className="text-sm font-medium mb-2">Admin Remarks</p>
                <div className="bg-muted p-3 rounded-md min-h-[60px]">
                  <p className="text-sm text-muted-foreground italic">
                    "{request.remarks || "No remarks provided."}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {(request.approvedBy || request.approvedDate || request.rejectedDate) && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {request.status === 'REJECTED' ? 'Rejection Details' : 'Approval Details'}
              </p>
              <div className="flex items-center gap-2">
                {request.approvedBy && (
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px]">
                      {getInitials(request.approvedBy.name || "", request.approvedBy.username)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <p className="text-xs text-muted-foreground">
                  {request.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                  {request.approvedBy && ` by ${request.approvedBy.name || request.approvedBy.username}`}
                  {' '}on {new Date(request.approvedDate || request.rejectedDate || "").toLocaleString()}
                </p>
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
