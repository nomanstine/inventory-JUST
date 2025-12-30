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
  const { isAuthenticated, user } = useAuth();

  const { data: inventorySummary, isLoading: isLoadingInventory } = useMyOfficeInventorySummary();
  const { data: purchases = [], isLoading: isLoadingPurchases } = usePurchases();
  const { data: itemRequests = [], isLoading: isLoadingRequests } = useItemRequests();
  const { data: transactions = [], isLoading: isLoadingTransactions } = useMyOfficeTransactionHistory();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <PageLayout
        header={<Header title="Dashboard" subtitle="Loading..." />}
        body={<div className="flex justify-center items-center h-64">Please wait...</div>}
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

  const totalPurchaseValue = purchases.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  return (
    <PageLayout
      header={
        <Header
          title="Dashboard"
          subtitle="Overview of your office inventory and activities"
        />
      }
      body={
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingInventory ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{totalItems}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  In inventory
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Items</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {isLoadingInventory ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">{availableItems}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ready for use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Use</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {isLoadingInventory ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-blue-600">{inUseItems}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Currently assigned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-orange-600">{pendingRequests}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Breakdown of items by status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInventory ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Available</span>
                      </div>
                      <Badge variant="secondary">{availableItems}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">In Use</span>
                      </div>
                      <Badge variant="secondary">{inUseItems}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Damaged</span>
                      </div>
                      <Badge variant="secondary">{damagedItems}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Purchases */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Purchases</CardTitle>
                <CardDescription>Latest item acquisitions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPurchases ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : recentPurchases.length > 0 ? (
                  <div className="space-y-3">
                    {recentPurchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{purchase.item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {purchase.quantity} units • ৳{(purchase.quantity * purchase.unitPrice).toFixed(2)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(purchase.purchasedDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent purchases</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Item Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Latest item requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{request.item.name}</p>
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
                        >
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent requests</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest item movements</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => {
                      const isOutgoing = transaction.fromOffice.id === summary?.officeId;
                      const otherOffice = isOutgoing ? transaction.toOffice.name : transaction.fromOffice.name;
                      const direction = isOutgoing ? 'to' : 'from';
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{transaction.itemInstance.item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.transactionType} • {direction} {otherOffice}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Items */}
          {summary?.items && summary.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Items</CardTitle>
                <CardDescription>Most stocked items in your inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.items.slice(0, 5).map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          Available: {item.statusBreakdown.AVAILABLE || 0} •
                          In Use: {item.statusBreakdown.IN_USE || 0}
                        </p>
                      </div>
                      <Badge variant="secondary">{item.quantity} total</Badge>
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

