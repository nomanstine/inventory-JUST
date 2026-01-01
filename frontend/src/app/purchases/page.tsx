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
  usePurchases,
  Purchase,
} from "@/services/purchaseService";
import { useItems } from "@/services/itemService";
import { CreatePurchaseDialog } from "./components/CreatePurchaseDialog";
import { PurchasesTable } from "./components/PurchasesTable";
import { usePurchaseForm } from "./hooks/usePurchaseForm";

const searchConfig = {
  placeholder: "Search by supplier, invoice number...",
  searchKeys: ["supplier", "invoiceNumber", "remarks"],
};

const filterConfig = [
  {
    key: "supplier",
    label: "Supplier",
    options: [
      { label: "All", value: "all" },
    ],
  },
];

export default function PurchasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: purchases = [], isLoading } = usePurchases();
  const { data: items = [] } = useItems();
  
  const {
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
    isCreating,
  } = usePurchaseForm();

  const [searchedData, setSearchedData] = useState<Purchase[]>(purchases);
  const [filteredData, setFilteredData] = useState<Purchase[]>(purchases);
  const [paginatedData, setPaginatedData] = useState<Purchase[]>(purchases);

  // Reset search/filter/pagination states when purchases data changes
  useEffect(() => {
    setSearchedData(purchases);
    setFilteredData(purchases);
    setPaginatedData(purchases);
  }, [purchases]);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Purchases" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view purchases</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  const handleCreatePurchase = async () => {
    try {
      await createPurchase();
      const count = purchaseItems.length;
      toast.success(`Successfully created ${count} purchase${count !== 1 ? 's' : ''}`);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create purchase:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create purchase";
      toast.error(errorMessage);
    }
  };

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  return (
    <>
      <PageLayout
        header={
          <Header 
            title="Purchases" 
            subtitle="Record and manage item purchases for your office"
            actions={
              isAdmin ? (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Purchase
                </Button>
              ) : null
            }
          />
        }
        body={
          <div className="space-y-4">
            <Search 
              config={searchConfig} 
              data={purchases} 
              onSearchedData={setSearchedData} 
            />
            <Filter 
              filters={filterConfig} 
              data={searchedData} 
              onFilteredData={setFilteredData} 
            />
            <PurchasesTable 
              data={paginatedData}
              isLoading={isLoading}
            />
            <Pagination 
              data={filteredData} 
              onPaginatedData={setPaginatedData} 
            />
          </div>
        }
      />
      
      <CreatePurchaseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        items={items}
        onSubmit={handleCreatePurchase}
        isSubmitting={isCreating}
        purchaseItems={purchaseItems}
        supplier={supplier}
        invoiceNumber={invoiceNumber}
        purchaseDate={purchaseDate}
        remarks={remarks}
        receiptUrl={receiptUrl}
        receiptFile={receiptFile}
        onSupplierChange={setSupplier}
        onInvoiceNumberChange={setInvoiceNumber}
        onPurchaseDateChange={setPurchaseDate}
        onRemarksChange={setRemarks}
        onReceiptChange={setReceipt}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateItemQuantity}
        onUpdateUnitPrice={updateItemUnitPrice}
      />
    </>
  );
}
