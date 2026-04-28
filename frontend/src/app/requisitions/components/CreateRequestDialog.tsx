import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { Item } from "@/services/itemService";
import { Office } from "@/services/officeService";
import { ItemRequestLine } from "../hooks/useRequisitionForm";

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  offices: Office[];
  currentUserOfficeId?: number;
  onSubmit: () => void;
  isSubmitting: boolean;
  requestItems: ItemRequestLine[];
  parentOfficeId: number;
  reason: string;
  onParentOfficeChange: (id: number) => void;
  onReasonChange: (reason: string) => void;
  onAddItem: (itemId: number, itemName: string, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onSuggest: () => Promise<void>;
  isSuggesting: boolean;
  aiUnavailableHint?: string;
  lockOfficeSelection?: boolean;
}

export function CreateRequestDialog({
  open,
  onOpenChange,
  items,
  offices,
  currentUserOfficeId,
  onSubmit,
  isSubmitting,
  requestItems,
  parentOfficeId,
  reason,
  onParentOfficeChange,
  onReasonChange,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onSuggest,
  isSuggesting,
  aiUnavailableHint,
  lockOfficeSelection = false,
}: CreateRequestDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);

  const availableOffices = offices.filter(
    office => office.id !== currentUserOfficeId
  );

  const handleAddItem = () => {
    if (selectedItemId && quantity > 0) {
      const item = items.find(i => i.id === selectedItemId);
      if (item) {
        onAddItem(selectedItemId, item.name, quantity);
        setSelectedItemId(0);
        setQuantity(0);
      }
    }
  };

  const handleSuggest = async () => {
    await onSuggest();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Requisition</DialogTitle>
          <DialogDescription>
            Request multiple items from another office
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="office">Request From Office *</Label>
            <Select
              value={parentOfficeId.toString()}
              onValueChange={(value) => onParentOfficeChange(parseInt(value))}
              disabled={lockOfficeSelection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {availableOffices.map((office) => (
                  <SelectItem key={office.id} value={office.id.toString()}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lockOfficeSelection && (
              <p className="text-xs text-muted-foreground mt-1">
                Source office is pre-selected for your logged-in office.
              </p>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Label>Add Items</Label>
            <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-2">
              <div className="sm:col-span-6">
                <Select
                  value={selectedItemId.toString()}
                  onValueChange={(value) => setSelectedItemId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-4">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Quantity"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedItemId || quantity <= 0}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Add Item</span>
                </Button>
              </div>
            </div>
          </div>

          {requestItems.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{item.itemName}</div>
                          {item.rationale && (
                            <p className="text-xs text-muted-foreground">{item.rationale}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => 
                            onUpdateQuantity(index, parseInt(e.target.value) || 0)
                          }
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSuggest}
              disabled={isSuggesting || !parentOfficeId}
            >
              {isSuggesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suggesting...
                </>
              ) : (
                "Refresh AI Suggestions"
              )}
            </Button>
          </div>

          {aiUnavailableHint && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{aiUnavailableHint}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting || requestItems.length === 0 || !parentOfficeId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${requestItems.length} Request${requestItems.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
