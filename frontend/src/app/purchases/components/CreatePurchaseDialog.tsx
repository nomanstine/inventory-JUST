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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, Package, Calculator, Calendar, FileText, Upload, X, Image as ImageIcon } from "lucide-react";
import { PurchaseItemLine } from "../hooks/usePurchaseForm";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";

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
  receiptUrl: string;
  receiptFile: File | null;
  onSupplierChange: (value: string) => void;
  onInvoiceNumberChange: (value: string) => void;
  onPurchaseDateChange: (value: string) => void;
  onRemarksChange: (value: string) => void;
  onReceiptChange: (url: string, file: File | null) => void;
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
  receiptUrl,
  receiptFile,
  onSupplierChange,
  onInvoiceNumberChange,
  onPurchaseDateChange,
  onRemarksChange,
  onReceiptChange,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateUnitPrice,
}: CreatePurchaseDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setUploadProgress(0);

    try {
      const result = await uploadToCloudinary(file, 'receipts', (progress) => {
        setUploadProgress(progress);
      });
      
      onReceiptChange(result.secure_url, file);
      toast.success('Receipt uploaded successfully');
    } catch (error: any) {
      console.error('Receipt upload error:', error);
      toast.error(error.message || 'Failed to upload receipt');
      onReceiptChange('', null);
    } finally {
      setUploadingReceipt(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveReceipt = () => {
    onReceiptChange('', null);
  };

  const totalAmount = purchaseItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 
    0
  );

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Create New Purchase
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Record a new purchase of items for your office inventory. Fill in the details below and add the purchased items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Purchase Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-sm font-medium">
                    Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="supplier"
                    value={supplier}
                    onChange={(e) => onSupplierChange(e.target.value)}
                    placeholder="Enter supplier name"
                    className={!supplier ? "border-red-300 focus:border-red-500" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber" className="text-sm font-medium">
                    Invoice Number
                  </Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => onInvoiceNumberChange(e.target.value)}
                    placeholder="Enter invoice number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Purchase Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate || today}
                  onChange={(e) => onPurchaseDateChange(e.target.value)}
                  max={today}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-sm font-medium">
                  Remarks
                </Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => onRemarksChange(e.target.value)}
                  placeholder="Add any additional notes or comments..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt" className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Receipt / Invoice Document (Optional)
                </Label>
                {!receiptUrl ? (
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleReceiptUpload}
                        disabled={uploadingReceipt}
                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {uploadingReceipt && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{uploadProgress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload receipt image (JPEG, PNG, GIF, WebP) or PDF. Max 10MB.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {receiptFile && receiptFile.type.startsWith('image/') ? (
                          <ImageIcon className="h-10 w-10 text-green-600" />
                        ) : (
                          <FileText className="h-10 w-10 text-blue-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {receiptFile?.name || 'Receipt uploaded'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {receiptFile ? `${(receiptFile.size / 1024).toFixed(2)} KB` : 'Uploaded successfully'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveReceipt}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {receiptFile && receiptFile.type.startsWith('image/') && (
                      <div className="mt-3 border-t pt-3">
                        <img 
                          src={receiptUrl} 
                          alt="Receipt preview" 
                          className="max-h-40 rounded object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Item Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Purchase Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mobile Layout */}
                <div className="block sm:hidden space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Item</Label>
                    <Select
                      value={selectedItemId.toString()}
                      onValueChange={(value) => setSelectedItemId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item to purchase" />
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Unit Price (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemUnitPrice}
                        onChange={(e) => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full"
                    disabled={!selectedItemId || itemQuantity <= 0 || itemUnitPrice < 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {/* Desktop/Tablet Layout */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 sm:col-span-5 space-y-2">
                    <Label className="text-sm font-medium">Item</Label>
                    <Select
                      value={selectedItemId.toString()}
                      onValueChange={(value) => setSelectedItemId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item to purchase" />
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
                  <div className="col-span-6 sm:col-span-2 space-y-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3 space-y-2">
                    <Label className="text-sm font-medium">Unit Price (৳)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemUnitPrice}
                      onChange={(e) => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-2">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full"
                      disabled={!selectedItemId || itemQuantity <= 0 || itemUnitPrice < 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {purchaseItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Purchase Items ({purchaseItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Desktop/Tablet Header */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-sm font-medium text-gray-700 pb-2 border-b">
                    <div className="col-span-5">Item Name</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Unit Price</div>
                    <div className="col-span-2 text-center">Total</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>
                  
                  {/* Items */}
                  {purchaseItems.map((item, index) => (
                    <div key={index}>
                      {/* Mobile Layout */}
                      <div className="block sm:hidden p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium text-sm block">{item.itemName}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(index)}
                            className="h-8 w-8 p-0 hover:bg-red-50 ml-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                              className="text-center h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Unit Price (৳)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => onUpdateUnitPrice(index, parseFloat(e.target.value) || 0)}
                              className="text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium">Total:</span>
                          <span className="font-semibold text-green-600">
                            ৳{(item.quantity * item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Desktop/Tablet Layout */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <div className="col-span-5">
                          <span className="font-medium text-sm">{item.itemName}</span>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                            className="text-center h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => onUpdateUnitPrice(index, parseFloat(e.target.value) || 0)}
                            className="text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="font-semibold text-green-600">
                            ৳{(item.quantity * item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(index)}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  {/* Total */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2">
                    <span className="text-lg font-semibold flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      ৳{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-4 pt-6 border-t">
          {(!supplier || purchaseItems.length === 0) && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg w-full">
              <strong className="block mb-1">Requirements:</strong>
              <div className="space-y-1">
                {!supplier && <div>• Supplier name is required</div>}
                {purchaseItems.length === 0 && <div>• At least one item must be added</div>}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={isSubmitting || !supplier || purchaseItems.length === 0}
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Create Purchase
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
