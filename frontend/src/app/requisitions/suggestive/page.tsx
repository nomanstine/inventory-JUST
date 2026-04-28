"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, ListChecks, Plus, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { useIsMobile } from "@/hooks/use-mobile";
import { useItems } from "@/services/itemService";
import { useOffices, Office } from "@/services/officeService";
import { usePurchases } from "@/services/purchaseService";
import { useRequisitionForm } from "../hooks/useRequisitionForm";
import { CreateRequestDialog } from "../components/CreateRequestDialog";
import { buildSuggestiveRequisition, SuggestedRequisitionItem } from "../utils/suggestiveRequisition";



export default function SuggestiveRequisitionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: purchases = [], isLoading: isLoadingPurchases, refetch } = usePurchases();
  const { data: items = [] } = useItems();
  const { data: offices = [] } = useOffices();

  const {
    items: requestItems,
    parentOfficeId: formParentOfficeId,
    setParentOfficeId: setFormParentOfficeId,
    reason: formReason,
    setReason: setFormReason,
    addItem,
    removeItem,
    updateItemQuantity,
    replaceItems,
    createRequest,
    isCreating,
  } = useRequisitionForm();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const currentUserOfficeId = user?.officeId ? parseInt(user.officeId, 10) : 0;
  const currentOffice = offices.find((o) => o.id === currentUserOfficeId);
  const parentOfficeId = currentOffice?.parent?.id || currentUserOfficeId;



  const myOfficePurchases = useMemo(() => {
    if (!currentUserOfficeId) {
      return [];
    }

    return purchases.filter((purchase) => purchase.office?.id === currentUserOfficeId);
  }, [purchases, currentUserOfficeId]);

  const suggestions = useMemo<SuggestedRequisitionItem[]>(() => {
    return buildSuggestiveRequisition(myOfficePurchases, items, 6);
  }, [myOfficePurchases, items]);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Suggestive Requisition" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view suggestive requisitions</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  const handleLoadIntoRequisition = () => {
    if (!parentOfficeId) {
      toast.error("No office found for this user.");
      return;
    }

    if (suggestions.length === 0) {
      toast.error("No suggestive items found from purchase history");
      return;
    }

    setFormParentOfficeId(parentOfficeId);
    setFormReason("Automatically suggested from frequent purchase history");
    replaceItems(
      suggestions.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        rationale: item.rationale,
      }))
    );

    setShowCreateDialog(true);
  };

  const handleFinalSubmit = async () => {
    try {
      await createRequest();
      toast.success("Requisition created successfully");
      setShowCreateDialog(false);
      router.push("/requisitions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create requisition");
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Purchase history refreshed");
  };

  return (
    <>
    <PageLayout
      header={
        <Header
          title="Suggestive Requisition"
          subtitle={isMobile ? "" : `Deterministic item suggestions based on purchase history for ${user?.officeName || 'your office'}`}
        />
      }
      body={
        <div className="space-y-6 max-w-5xl">
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Source Office
              </CardTitle>
              <CardDescription className="text-sm">
                Choose the office that will fulfill this requisition. Suggestions are derived from your office's frequent purchase history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Removed office dropdown. Always use logged-in user's office. */}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleLoadIntoRequisition} disabled={!parentOfficeId || suggestions.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Load Into Requisition
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={isLoadingPurchases}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Refresh History
                </Button>
                <Button variant="ghost" onClick={() => router.push("/requisitions")}>View Requisitions</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ListChecks className="h-5 w-5 text-blue-600" />
                Suggested Items
              </CardTitle>
              <CardDescription className="text-sm">
                Top items ranked by purchase frequency, quantity, and recency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPurchases ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Analyzing purchase history...</div>
              ) : suggestions.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No strong suggestions yet. This usually means there is not enough repeated purchase history to calculate a pattern.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={suggestion.itemId} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{index + 1}. {suggestion.itemName}</p>
                            <Badge variant="secondary">Score {suggestion.score.toFixed(1)}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{suggestion.rationale}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-900">Suggested Qty: {suggestion.quantity}</Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Purchased {suggestion.purchaseCount} times</span>
                        <span>Total bought: {suggestion.totalQuantity}</span>
                        {suggestion.lastPurchasedAt && <span>Last purchased: {new Date(suggestion.lastPurchasedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="space-y-3">
              <CardTitle className="text-base sm:text-lg text-blue-900">How the suggestions work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800">
              <p>This page uses pure calculations from purchase history only.</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Items bought repeatedly are ranked higher.</li>
                <li>Recent purchases influence the score more than older ones.</li>
                <li>Suggested quantities are based on average historical purchase size.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      }
    />

    <CreateRequestDialog
      open={showCreateDialog}
      onOpenChange={setShowCreateDialog}
      items={items}
      offices={offices}
      currentUserOfficeId={currentUserOfficeId}
      onSubmit={handleFinalSubmit}
      isSubmitting={isCreating}
      requestItems={requestItems}
      parentOfficeId={formParentOfficeId}
      reason={formReason}
      onParentOfficeChange={setFormParentOfficeId}
      onReasonChange={setFormReason}
      onAddItem={addItem}
      onRemoveItem={removeItem}
      onUpdateQuantity={updateItemQuantity}
      onSuggest={handleRefresh} // Reuse refresh logic
      isSuggesting={isLoadingPurchases}
    />
  </>
);
}