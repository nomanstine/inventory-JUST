"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import {
  PageLayout,
  Header
} from "@/components/page";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  ArrowRightLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";

import { useMyOfficeInventorySummary } from "@/services/inventoryService";
import { usePurchases } from "@/services/purchaseService";
import { useItemRequests } from "@/services/itemRequestService";
import { useMyOfficeTransactionHistory } from "@/services/inventoryService";

interface InventorySummary {
  officeId: number;
  totalItems: number;
  items: Array<{
    itemName: string;
    itemId: number;
    quantity: number;
    statusBreakdown: Record<string, number>;
  }>;
  overallStatusBreakdown: Record<string, number>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: inventorySummary, isLoading: isLoadingInventory } = useMyOfficeInventorySummary();
  const { data: purchases = [], isLoading: isLoadingPurchases } = usePurchases();
  const { data: itemRequests = [], isLoading: isLoadingRequests } = useItemRequests();
  const { data: transactions = [], isLoading: isLoadingTransactions } = useMyOfficeTransactionHistory();

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Dashboard" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view dashboard</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  const summary = inventorySummary as InventorySummary | undefined;

  // Calculate metrics
  const totalItems = summary?.totalItems || 0;
  const availableItems = summary?.overallStatusBreakdown?.AVAILABLE || 0;
  const inUseItems = summary?.overallStatusBreakdown?.IN_USE || 0;
  const damagedItems = summary?.overallStatusBreakdown?.DAMAGED || 0;
  const pendingRequests = itemRequests.filter(r => r.status === 'PENDING').length;
  const recentPurchases = purchases.slice(0, 5);
  const recentRequests = itemRequests.slice(0, 5);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <PageLayout
      header={
        <Header
          title="Dashboard"
          subtitle="Overview of your office inventory and activities"
        />
      }
      body={
        <div className="space-y-4 sm:space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Items</CardTitle>
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingInventory ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold">{totalItems}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  In inventory
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Available Items</CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingInventory ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{availableItems}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Ready for use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">In Use</CardTitle>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingInventory ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{inUseItems}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Currently assigned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Pending Requests</CardTitle>
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingRequests ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{pendingRequests}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Inventory Status Breakdown */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Inventory Status</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Breakdown of items by status</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingInventory ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Available</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{availableItems}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">In Use</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{inUseItems}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Damaged</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{damagedItems}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Purchases */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Recent Purchases</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest item acquisitions</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingPurchases ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : recentPurchases.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {recentPurchases.map((purchase) => (
                      <div 
                        key={purchase.id} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 hover:bg-accent p-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => router.push(`/purchases/${purchase.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {purchase.supplier} - {purchase.totalItems} item{purchase.totalItems !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {purchase.items.map(item => item.item.name).join(', ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total: ৳{purchase.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant="outline" className="self-start sm:self-auto text-xs whitespace-nowrap">
                          {new Date(purchase.purchasedDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">No recent purchases</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Item Requests */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Recent Requests</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest item requests</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingRequests ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : recentRequests.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {recentRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 hover:bg-accent p-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => router.push('/requisitions')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{request.item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.requestedQuantity} units • {request.status}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'APPROVED' ? 'default' :
                            request.status === 'PENDING' ? 'secondary' :
                            request.status === 'REJECTED' ? 'destructive' : 'outline'
                          }
                          className="self-start sm:self-auto text-xs"
                        >
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">No recent requests</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest item movements</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingTransactions ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : recentTransactions.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {recentTransactions.map((transaction) => {
                      const isOutgoing = transaction.fromOffice.id === summary?.officeId;
                      const otherOffice = isOutgoing ? transaction.toOffice.name : transaction.fromOffice.name;
                      const direction = isOutgoing ? 'to' : 'from';
                      
                      return (
                        <div 
                          key={transaction.id} 
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 hover:bg-accent p-2 rounded-lg cursor-pointer transition-colors"
                          onClick={() => router.push('/inventory')}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{transaction.itemInstance.item.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {transaction.transactionType} • {direction} {otherOffice}
                            </p>
                          </div>
                          <Badge variant="outline" className="self-start sm:self-auto text-xs whitespace-nowrap">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">No recent transactions</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Items */}
          {summary?.items && summary.items.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Top Items</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Most stocked items in your inventory</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {summary.items.slice(0, 5).map((item) => (
                    <div key={item.itemId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          Available: {item.statusBreakdown.AVAILABLE || 0} •
                          In Use: {item.statusBreakdown.IN_USE || 0}
                        </p>
                      </div>
                      <Badge variant="secondary" className="self-start sm:self-auto text-xs whitespace-nowrap">{item.quantity} total</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      }
    />
  );
}

