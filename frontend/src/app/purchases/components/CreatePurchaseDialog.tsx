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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PurchaseItemLine } from "../hooks/usePurchaseForm";

interface Item {
  id: number;
  name: string;
}

interface CreatePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  onSubmit: () => void;
  isSubmitting: boolean;
  purchaseItems: PurchaseItemLine[];
  supplier: string;
  invoiceNumber: string;
  purchaseDate: string;
  remarks: string;
  onSupplierChange: (value: string) => void;
  onInvoiceNumberChange: (value: string) => void;
  onPurchaseDateChange: (value: string) => void;
  onRemarksChange: (value: string) => void;
  onAddItem: (itemId: number, itemName: string, quantity: number, unitPrice: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateUnitPrice: (index: number, unitPrice: number) => void;
}

export function CreatePurchaseDialog({
  open,
  onOpenChange,
  items,
  onSubmit,
  isSubmitting,
  purchaseItems,
  supplier,
  invoiceNumber,
  purchaseDate,
  remarks,
  onSupplierChange,
  onInvoiceNumberChange,
  onPurchaseDateChange,
  onRemarksChange,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateUnitPrice,
}: CreatePurchaseDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);

  const handleAddItem = () => {
    if (selectedItemId && itemQuantity > 0 && itemUnitPrice >= 0) {
      const item = items.find(i => i.id === selectedItemId);
      if (item) {
        onAddItem(selectedItemId, item.name, itemQuantity, itemUnitPrice);
        setSelectedItemId(0);
        setItemQuantity(1);
        setItemUnitPrice(0);
      }
    }
  };

  const totalAmount = purchaseItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 
    0
  );

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Purchase</DialogTitle>
          <DialogDescription>
            Record a new purchase of items for your office inventory.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Purchase Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Supplier *</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => onSupplierChange(e.target.value)}
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => onInvoiceNumberChange(e.target.value)}
                placeholder="Enter invoice number"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="purchaseDate">Purchase Date *</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate || today}
              onChange={(e) => onPurchaseDateChange(e.target.value)}
              max={today}
            />
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
            />
          </div>

          {/* Add Item Section */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Purchase Items</Label>
            <div className="grid grid-cols-12 gap-2 mt-2">
              <div className="col-span-5">
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
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Unit Price"
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Items List */}
          {purchaseItems.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 pb-2 border-b">
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Total</div>
                <div className="col-span-1"></div>
              </div>
              {purchaseItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-sm">{item.itemName}</div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateUnitPrice(index, parseFloat(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-2 text-sm text-center">
                    ৳{(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 pt-2 border-t font-semibold">
                <div className="col-span-9 text-right">Total Amount:</div>
                <div className="col-span-2 text-center">৳{totalAmount.toFixed(2)}</div>
                <div className="col-span-1"></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting || !supplier || purchaseItems.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Purchase'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
