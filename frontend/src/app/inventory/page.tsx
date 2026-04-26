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
import { Eye, Package, History, ChevronDown, ChevronRight, QrCode } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { BarcodePrintDialog } from "@/components/BarcodePrintDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const paginationConfig = {
  itemsPerPage: 10,
  showEllipsis: true,
  maxVisiblePages: 5,
};

const RowActions = ({ item, onView, onPrintBarcode }: { item: ItemInstance, onView: (item: any) => void, onPrintBarcode: (item: ItemInstance) => void }) => (
  <div className="flex gap-2 sm:gap-3">
    <Eye
      className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-blue-600 transition-colors"
      onClick={() => onView(item)}
    />
    <span title="Print Barcode">
      <QrCode
        className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-green-600 transition-colors"
        onClick={() => onPrintBarcode(item)}
      />
    </span>
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

function Body({ data, onPrintBarcode, onPrintGroupBarcodes }: { 
  data: GroupedItem[], 
  onPrintBarcode: (item: ItemInstance) => void,
  onPrintGroupBarcodes: (group: GroupedItem) => void
}){
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
    <div className="mx-auto my-4 sm:my-6 md:my-8 max-w-7xl">
      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <Table>
          <TableCaption className="text-xs sm:text-sm">Inventory items belonging to your office.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 sm:w-10 text-xs sm:text-sm"></TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Item Name</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Category</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Quantity</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Barcode</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">Purchase Date</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
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
                  className="bg-muted/50 hover:bg-muted font-medium"
                >
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => toggleGroup(key)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </TableCell>
                  <TableCell 
                    className="text-xs sm:text-sm font-semibold cursor-pointer"
                    onClick={() => toggleGroup(key)}
                  >
                    {group.itemName}
                  </TableCell>
                  <TableCell onClick={() => toggleGroup(key)} className="cursor-pointer hidden md:table-cell">
                    {group.category ? (
                      <Badge variant="outline" className="text-xs">{group.category.name}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={() => toggleGroup(key)} className="cursor-pointer">
                    <Badge variant="secondary" className="text-xs">{group.instances.length} items</Badge>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-muted-foreground hidden lg:table-cell" onClick={() => toggleGroup(key)}>-</TableCell>
                  <TableCell className="text-xs sm:text-sm text-muted-foreground hidden xl:table-cell" onClick={() => toggleGroup(key)}>-</TableCell>
                  <TableCell>
                    <span title={`Print all barcodes for ${group.itemName}`}>
                      <QrCode
                        className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-green-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintGroupBarcodes(group);
                        }}
                      />
                    </span>
                  </TableCell>
                </TableRow>

                {/* Individual Instance Rows */}
                {isExpanded && group.instances.map((instance) => (
                  <TableRow key={instance.id} className="bg-background/50 border-l-2 sm:border-l-4 border-l-muted">
                    <TableCell className="w-8 sm:w-10"></TableCell>
                    <TableCell className="text-xs sm:text-sm pl-4 sm:pl-8 text-muted-foreground">↳</TableCell>
                    <TableCell className="hidden md:table-cell"></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-xs sm:text-sm font-mono hidden lg:table-cell">{instance.barcode}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden xl:table-cell">
                      {instance.purchaseDate ? (
                        new Date(instance.purchaseDate).toLocaleDateString()
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RowActions item={instance} onView={handleView} onPrintBarcode={onPrintBarcode} />
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      </div>
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
  user?: {
    name?: string;
    username: string;
    avatarUrl?: string | null;
  };
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
        reason: 'Purchase',
        user: {
          name: purchase.purchasedBy.name || purchase.purchasedBy.fullName,
          username: purchase.purchasedBy.username,
          avatarUrl: purchase.purchasedBy.avatarUrl
        }
      }))
    ),
    ...transactions.filter(t => t.toOffice?.id === parseInt(user?.officeId || '0') && t.status !== 'PENDING').map(transaction => ({ 
      type: '+',
      itemName: transaction.itemInstance?.item?.name || 'Unknown Item',
      source: transaction.fromOffice?.name || 'Unknown',
      quantity: transaction.quantity,
      date: transaction.transactionDate,
      reason: 'Transfer In',
      user: {
        name: transaction.user.fullName,
        username: transaction.user.username,
        avatarUrl: transaction.user.avatarUrl
      }
    })),
    // Deductions (-)
    ...transactions.filter(t => t.fromOffice?.id === parseInt(user?.officeId || '0') && t.status !== 'PENDING').map(transaction => ({ 
      type: '-',
      itemName: transaction.itemInstance?.item?.name || 'Unknown Item',
      source: transaction.toOffice?.name || 'Unknown',
      quantity: transaction.quantity,
      date: transaction.transactionDate,
      reason: 'Transfer Out',
      user: {
        name: transaction.user.fullName,
        username: transaction.user.username,
        avatarUrl: transaction.user.avatarUrl
      }
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
    if (item.user && !acc[key].user) {
      acc[key].user = item.user;
    }
    return acc;
  }, {} as Record<string, HistoryItem>);

  const historyItems = Object.values(groupedItems)
    .sort((a: HistoryItem, b: HistoryItem) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>

      <div className="mx-auto my-4 sm:my-6 md:my-8 max-w-7xl">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <Table>
            <TableCaption className="text-xs sm:text-sm">Complete inventory movement history.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Item Name</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Source/Destination</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Quantity</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Type</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">User</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                    No transaction history available
                  </TableCell>
                </TableRow>
              ) : (
                historyItems.map((item: HistoryItem, index: number) => (
                  <TableRow key={`${item.type}-${index}`}>
                    <TableCell className="text-xs sm:text-sm font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{item.source}</TableCell>
                    <TableCell className={`text-xs sm:text-sm font-medium ${item.type === '+' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === '+' ? '+' : '-'}{item.quantity}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{item.reason}</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.user ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={item.user.avatarUrl || ""} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(item.user.name, item.user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="hidden sm:inline">{item.user.name || item.user.username}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>
        </div>
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
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<{ itemInstanceId: number; barcode: string; itemName: string; }[]>([]);

  // Calculate actual history count (all purchase items + incoming/outgoing non-pending transactions)
  const historyCount = purchases.reduce((sum, purchase) => sum + (purchase.items?.length || 0), 0) + 
    transactions.filter(t => 
      t.status !== 'PENDING' && 
      (t.toOffice?.id === parseInt(user?.officeId || '0') || t.fromOffice?.id === parseInt(user?.officeId || '0'))
    ).length;

  useEffect(() => {
    const filtered = searchInInventory(items, searchQuery);
    const grouped = groupItemsByName(filtered);
    setGroupedData(grouped);
  }, [items, searchQuery]);

  const handlePrintBarcode = (item: ItemInstance) => {
    setBarcodeItems([{
      itemInstanceId: item.id,
      barcode: item.barcode,
      itemName: item.item.name
    }]);
    setShowBarcodeDialog(true);
  };

  const handlePrintGroupBarcodes = (group: GroupedItem) => {
    const groupBarcodes = group.instances.map(instance => ({
      itemInstanceId: instance.id,
      barcode: instance.barcode,
      itemName: instance.item.name
    }));
    setBarcodeItems(groupBarcodes);
    setShowBarcodeDialog(true);
  };

  const handlePrintAllBarcodes = () => {
    const allBarcodes = items.map(item => ({
      itemInstanceId: item.id,
      barcode: item.barcode,
      itemName: item.item.name
    }));
    setBarcodeItems(allBarcodes);
    setShowBarcodeDialog(true);
  };

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Inventory" subtitle="" />}
        body={
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Authentication Required</CardTitle>
                <CardDescription className="text-sm sm:text-base">Please log in to view inventory</CardDescription>
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
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <div className="flex flex-col items-center gap-2">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
              <p className="text-sm sm:text-base">Loading inventory...</p>
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
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-destructive">Error</CardTitle>
                <CardDescription className="text-sm sm:text-base">Failed to load inventory data</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  return (
    <>
      <PageLayout
        header={
          <Header 
            title="My Office Inventory" 
            subtitle="View current items and complete history"
            actions={
              items.length > 0 ? (
                <Button onClick={handlePrintAllBarcodes} variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                  <QrCode className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Print All Barcodes
                </Button>
              ) : null
            }
          />
        }
        body={
          <div className="mx-auto my-2 sm:my-4 max-w-7xl">
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
                <TabsTrigger value="current" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Current Items</span>
                  <span className="xs:hidden">Current</span>
                  <span className="ml-1">({groupedData.length}/{items.length})</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <History className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>History ({historyCount})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-3 sm:space-y-4">

                <div className="mb-3 sm:mb-4">
                  <input
                    type="text"
                    placeholder="Search inventory items..."
                    className="border rounded px-3 py-2 w-full sm:w-64 text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {groupedData.length === 0 ? (
                  <div className="flex items-center justify-center h-[30vh]">
                    <div className="text-center px-4">
                      <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        {items.length === 0 
                          ? "No inventory items found in your office"
                          : "No items match your search"}
                      </p>
                    </div>
                  </div>
                ) : (
                <>
                  <Body 
                    data={paginatedData} 
                    onPrintBarcode={handlePrintBarcode}
                    onPrintGroupBarcodes={handlePrintGroupBarcodes}
                  />
                  <Pagination
                    data={groupedData}
                    config={paginationConfig}
                    onPaginatedData={setPaginatedData}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-3 sm:space-y-4">
              <HistoryTable purchases={purchases} transactions={transactions} />
            </TabsContent>
          </Tabs>
        </div>
      }
      />

      <BarcodePrintDialog
        open={showBarcodeDialog}
        onOpenChange={setShowBarcodeDialog}
        items={barcodeItems}
        title="Print Barcode Labels"
      />
    </>
  );
}
