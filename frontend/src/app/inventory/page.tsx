"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  PageLayout,
  Header
} from "@/components/page";

import { FilterGroup as Filter } from "@/components/filters";
import { SearchGroup as Search } from "@/components/search";
import { PaginationGroup as Pagination } from "@/components/pagination";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Package, History } from "lucide-react";
import { useTableActions } from "@/hooks/useTableActions";
import { 
  useMyOfficeInventory, 
  ItemInstance, 
  useMyOfficePurchases, 
  Purchase, 
  useMyOfficeTransactionHistory, 
  ItemTransaction 
} from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchConfig = {
  placeholder: "Search inventory items...",
  searchKeys: ["barcode"],
};

const paginationConfig = {
  itemsPerPage: 10,
  showEllipsis: true,
  maxVisiblePages: 5,
};

const RowActions = ({ item, onView }: { item: ItemInstance, onView: (item: any) => void }) => (
  <div className="flex gap-2">
    <Eye
      className="w-5 h-5 cursor-pointer hover:text-blue-600"
      onClick={() => onView(item)}
    />
  </div>
);

// Helper function to search in nested object properties
const searchInInventory = (items: ItemInstance[], query: string): ItemInstance[] => {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter(instance => 
    instance.barcode.toLowerCase().includes(lowerQuery) ||
    instance.item.name.toLowerCase().includes(lowerQuery) ||
    (instance.item.description?.toLowerCase().includes(lowerQuery) ?? false) ||
    instance.ownerOffice.name.toLowerCase().includes(lowerQuery)
  );
};

function Body({ data }: { data: ItemInstance[] }){
  const { handleView } = useTableActions("/inventory");

  return(
    <>
    <div className="mx-auto my-8 max-w-7xl">
      <Table>
        <TableCaption>Inventory items belonging to your office.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Barcode</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((instance) => (
          <TableRow key={instance.id}>
            <TableCell className="font-mono font-medium">{instance.barcode}</TableCell>
            <TableCell className="font-medium">{instance.item.name}</TableCell>
            <TableCell>
              {instance.item.category ? (
                <Badge variant="outline">{instance.item.category.name}</Badge>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              {instance.purchaseDate ? (
                new Date(instance.purchaseDate).toLocaleDateString()
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              <RowActions item={instance} onView={handleView} />
            </TableCell>
          </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  )
}

function HistoryTable({ purchases, transactions }: { purchases: Purchase[], transactions: ItemTransaction[] }) {
  const { user } = useAuth();
  
  // Create combined history with + and - indicators
  const historyItems = [
    // Additions (+)
    ...purchases.map(purchase => ({ 
      type: '+',
      itemName: purchase.item.name,
      source: purchase.supplier || 'Supplier',
      quantity: purchase.quantity,
      date: purchase.purchasedDate,
      reason: 'Purchase'
    })),
    ...transactions.filter(t => t.toOffice.id === parseInt(user?.officeId || '0') && t.status !== 'PENDING').map(transaction => ({ 
      type: '+',
      itemName: transaction.itemInstance.item.name,
      source: transaction.fromOffice?.name || 'Unknown',
      quantity: transaction.quantity,
      date: transaction.transactionDate,
      reason: 'Transfer In'
    })),
    // Deductions (-)
    ...transactions.filter(t => t.fromOffice.id === parseInt(user?.officeId || '0') && t.status !== 'PENDING').map(transaction => ({ 
      type: '-',
      itemName: transaction.itemInstance.item.name,
      source: transaction.toOffice?.name || 'Unknown',
      quantity: transaction.quantity,
      date: transaction.transactionDate,
      reason: 'Transfer Out'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>

      <div className="mx-auto my-8 max-w-7xl">
        <Table>
          <TableCaption>Complete inventory movement history.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Source/Destination</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyItems.map((item, index) => (
              <TableRow key={`${item.type}-${index}`}>
                <TableCell>
                  <Badge variant={item.type === '+' ? 'default' : 'destructive'}>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.reason}</TableCell>
                <TableCell>
                  {new Date(item.date).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useMyOfficeInventory();
  const { data: purchases = [], isLoading: purchasesLoading, error: purchasesError } = useMyOfficePurchases();
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useMyOfficeTransactionHistory();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedData, setSearchedData] = useState<ItemInstance[]>([]);
  const [paginatedData, setPaginatedData] = useState<ItemInstance[]>([]);

  useEffect(() => {
    const filtered = searchInInventory(items, searchQuery);
    setSearchedData(filtered);
  }, [items, searchQuery]);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Inventory" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view inventory</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  if (itemsLoading || purchasesLoading || transactionsLoading) {
    return (
      <PageLayout
        header={<Header title="My Office Inventory" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <div className="flex flex-col items-center gap-2">
              <Package className="w-8 h-8 animate-pulse" />
              <p>Loading inventory...</p>
            </div>
          </div>
        }
      />
    );
  }

  if (itemsError || purchasesError || transactionsError) {
    return (
      <PageLayout
        header={<Header title="My Office Inventory" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription>Failed to load inventory data</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header 
          title="My Office Inventory" 
          subtitle="View current items and complete history"
        />
      }
      body={
        <div className="mx-auto my-4 max-w-7xl">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Current Items ({items.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History ({purchases.length + transactions.filter(t => t.status !== 'PENDING').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search inventory items..."
                  className="border rounded px-3 py-2 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchedData.length === 0 ? (
                <div className="flex items-center justify-center h-[30vh]">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      {items.length === 0 
                        ? "No inventory items found in your office"
                        : "No items match your search"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Body data={paginatedData} />
                  <Pagination
                    data={searchedData}
                    config={paginationConfig}
                    onPaginatedData={setPaginatedData}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <HistoryTable purchases={purchases} transactions={transactions} />
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
