import { useState } from "react";
import {
  PurchaseForm,
  useCreatePurchase,
} from "@/services/purchaseService";

export interface PurchaseItemLine {
  itemId: number;
  itemName?: string;
  quantity: number;
  unitPrice: number;
}

const initialFormData: PurchaseItemLine[] = [];

export function usePurchaseForm() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemLine[]>(initialFormData);
  const [supplier, setSupplier] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const createMutation = useCreatePurchase();

  const addItem = (itemId: number, itemName: string, quantity: number, unitPrice: number) => {
    setPurchaseItems(prev => [...prev, { itemId, itemName, quantity, unitPrice }]);
  };

  const removeItem = (index: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setPurchaseItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const updateItemUnitPrice = (index: number, unitPrice: number) => {
    setPurchaseItems(prev => prev.map((item, i) => 
      i === index ? { ...item, unitPrice } : item
    ));
  };

  const setReceipt = (url: string, file: File | null) => {
    setReceiptUrl(url);
    setReceiptFile(file);
  };

  const validateForm = (): boolean => {
    if (!supplier || purchaseItems.length === 0 || !purchaseDate) {
      return false;
    }
    return purchaseItems.every(item => item.quantity > 0 && item.unitPrice >= 0);
  };

  const resetForm = () => {
    setPurchaseItems(initialFormData);
    setSupplier("");
    setInvoiceNumber("");
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setRemarks("");
    setReceiptUrl("");
    setReceiptFile(null);
  };

  const createPurchase = async (): Promise<boolean> => {
    if (!validateForm()) {
      throw new Error("Please fill in all required fields and add at least one item");
    }

    try {
      // Create multiple purchases, one for each item
      const promises = purchaseItems.map(item => {
        const purchaseData: PurchaseForm = {
          item: { id: item.itemId },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          supplier: supplier,
          remarks: remarks || undefined,
          receiptUrl: receiptUrl || undefined,
        };
        return createMutation.mutateAsync(purchaseData);
      });

      await Promise.all(promises);
      resetForm();
      return true;
    } catch (error: any) {
      console.error("Purchase error:", error);
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data 
        || error?.message 
        || "Failed to create purchase";
      
      // Convert error to string if it's an object
      const finalMessage = typeof errorMessage === 'string' 
        ? errorMessage 
        : JSON.stringify(errorMessage);
      
      throw new Error(finalMessage);
    }
  };

  return {
    purchaseItems,
    supplier,
    setSupplier,
    invoiceNumber,
    setInvoiceNumber,
    purchaseDate,
    setPurchaseDate,
    remarks,
    setRemarks,
    receiptUrl,
    receiptFile,
    setReceipt,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemUnitPrice,
    createPurchase,
    isCreating: createMutation.isPending,
  };
}
