"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Fragment } from "react";

import {
  PageLayout,
  Header
} from "@/components/page";

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
import { Eye, Package, History, ChevronDown, ChevronRight } from "lucide-react";
import { 
  useMyOfficeInventory, 
  ItemInstance, 
  useMyOfficePurchases, 
  useMyOfficeTransactionHistory, 
  ItemTransaction 
} from "@/services/inventoryService";
import { Purchase, PurchaseItem } from "@/services/purchaseService";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type GroupedItem = {
  itemId: number;
  itemName: string;
  category: any;
  instances: ItemInstance[];
};

const groupItemsByName = (items: ItemInstance[]): GroupedItem[] => {
  const grouped = items.reduce((acc, instance) => {
    const key = `${instance.item.id}-${instance.item.name}`;
    if (!acc[key]) {
      acc[key] = {
        itemId: instance.item.id,
        itemName: instance.item.name,
        category: instance.item.category,
        instances: []
      };
    }
    acc[key].instances.push(instance);
    return acc;
  }, {} as Record<string, GroupedItem>);
  
  return Object.values(grouped);
};

function Body({ data }: { data: GroupedItem[] }){
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };
  
  const handleView = (item: ItemInstance) => {
    router.push(`/barcode?barcode=${item.barcode}`);
  };

  return(
    <>
    <div className="mx-auto my-8 max-w-7xl">
      <Table>
        <TableCaption>Inventory items belonging to your office.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((group) => {
            const key = `${group.itemId}-${group.itemName}`;
            const isExpanded = expandedGroups.has(key);
            
            return (
              <Fragment key={key}>
                {/* Group Header Row */}
                <TableRow 
                  className="bg-muted/50 hover:bg-muted cursor-pointer font-medium"
                  onClick={() => toggleGroup(key)}
                >
                  <TableCell>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{group.itemName}</TableCell>
                  <TableCell>
                    {group.category ? (
                      <Badge variant="outline">{group.category.name}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{group.instances.length} items</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell></TableCell>
                </TableRow>

                {/* Individual Instance Rows */}
                {isExpanded && group.instances.map((instance) => (
                  <TableRow key={instance.id} className="bg-background/50 border-l-4 border-l-muted">
                    <TableCell className="w-10"></TableCell>
                    <TableCell className="pl-8 text-muted-foreground">↳</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-mono text-sm">{instance.barcode}</TableCell>
                    <TableCell className="text-sm">
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
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </>
  )
}

type HistoryItem = {
  type: string;
  itemName: string;
  source: string;
  quantity: number;
  date: string;
  reason: string;
};

function HistoryTable({ purchases, transactions }: { purchases: Purchase[], transactions: ItemTransaction[] }) {
  const { user } = useAuth();
  
  // Create combined history with + and - indicators
  const allItems = [
    // Additions (+) - from purchases (flatten items array)
    ...purchases.flatMap(purchase => 
      (purchase.items || []).map((item: PurchaseItem) => ({
        type: '+',
        itemName: item.item?.name || 'Unknown Item',
        source: purchase.supplier || 'Supplier',
        quantity: item.quantity || 1,
        date: purchase.purchasedDate,
        reason: 'Purchase'
      }))
    ),
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
  ];

  // Group items by date, type, reason, source, and item name
  const groupedItems = allItems.reduce((acc, item) => {
    const key = `${item.date}-${item.type}-${item.reason}-${item.source}-${item.itemName}`;
    if (!acc[key]) {
      acc[key] = {
        type: item.type,
        itemName: item.itemName,
        source: item.source,
        date: item.date,
        reason: item.reason,
        quantity: 0
      };
    }
    acc[key].quantity += item.quantity;
    return acc;
  }, {} as Record<string, HistoryItem>);

  const historyItems = Object.values(groupedItems)
    .sort((a: HistoryItem, b: HistoryItem) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>

      <div className="mx-auto my-8 max-w-7xl">
        <Table>
          <TableCaption>Complete inventory movement history.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Source/Destination</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No transaction history available
                </TableCell>
              </TableRow>
            ) : (
              historyItems.map((item: HistoryItem, index: number) => (
                <TableRow key={`${item.type}-${index}`}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell className={`font-medium ${item.type === '+' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === '+' ? '+' : '-'}{item.quantity}
                  </TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
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
  const [groupedData, setGroupedData] = useState<GroupedItem[]>([]);
  const [paginatedData, setPaginatedData] = useState<GroupedItem[]>([]);

  // Calculate actual history count (all purchase items + incoming/outgoing non-pending transactions)
  const historyCount = purchases.reduce((sum, purchase) => sum + (purchase.items?.length || 0), 0) + 
    transactions.filter(t => 
      t.status !== 'PENDING' && 
      (t.toOffice.id === parseInt(user?.officeId || '0') || t.fromOffice.id === parseInt(user?.officeId || '0'))
    ).length;

  useEffect(() => {
    const filtered = searchInInventory(items, searchQuery);
    const grouped = groupItemsByName(filtered);
    setGroupedData(grouped);
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
                Current Items ({groupedData.length} unique, {items.length} total)
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History ({historyCount})
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

              {groupedData.length === 0 ? (
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
                    data={groupedData}
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
