"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

              {/* Removed office dropdown. Always use logged-in user's office. */}
  const currentOffice = offices.find((office) => office.id === currentUserOfficeId);
  const parentOfficeId = currentOffice?.parent?.id;

  if (parentOfficeId) {
    const parentOffice = offices.find((office) => office.id === parentOfficeId);
    return parentOffice ? [parentOffice] : [];
  }

  return offices.filter((office) => office.id !== currentUserOfficeId);
};

export default function AIRecommendationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: offices = [] } = useOffices();
  const canCreate = canCreateByRole(user?.role);

  const suggestionMutation = useRequisitionSuggestions();

  const [reason, setReason] = useState("");
  // Always use the logged-in user's office
  const parentOfficeId = currentUserOfficeId;
  const [suggestionSummary, setSuggestionSummary] = useState("");
  const [aiUnavailableHint, setAiUnavailableHint] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    rationale?: string;
  }>>([]);

  const currentUserOfficeId = user?.officeId ? parseInt(user.officeId, 10) : 0;



  if (!user) {
    return (
      <PageLayout
        header={<Header title="AI Recommendations" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view AI recommendations</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  const handleSuggest = async () => {
    try {
      if (!parentOfficeId) {
        throw new Error("No office found for this user");
      }

      const response = await suggestionMutation.mutateAsync({
        parentOfficeId,
        reason: reason,
      });

      if (!response.suggestions || response.suggestions.length === 0) {
        throw new Error(response.warning || "AI returned no usable suggestions");
      }

      setSuggestions(response.suggestions);
      setSuggestionSummary(response.summary || "AI suggestions generated");
      setAiUnavailableHint(response.warning || "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch suggestions";
      const normalized = message.toLowerCase();
      if (normalized.includes("api key") || normalized.includes("disabled")) {
        setAiUnavailableHint("AI suggestions are unavailable right now. Ask an admin to configure backend AI_REQUISITION_API_KEY.");
      }
      toast.error(message);
    }
  };

  const handleCreateFromRecommendations = () => {
    if (!canCreate) {
      toast.error("You do not have permission to create requisitions.");
      return;
    }

    if (!parentOfficeId) {
      toast.error("No office found for this user.");
      return;
    }

    if (suggestions.length === 0) {
      toast.error("Generate recommendations before creating a requisition draft.");
      return;
    }

    saveRequisitionDraft({
      parentOfficeId,
      reason: reason || "Prepared from AI recommendations",
      items: suggestions.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        rationale: item.rationale,
      })),
    });

    toast.success("Recommendations loaded into requisition draft");
    router.push("/requisitions");
  };

  return (
    <PageLayout
      header={
        <Header
          title="AI Recommendations"
          subtitle={`Smart requisition recommendations for ${user?.officeName || "your office"}`}
        />
      }
      body={
        <div className="space-y-6 max-w-4xl">
          {/* AI Recommendation Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Generate Recommendations
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use AI to analyze your office's inventory and request history to get smart recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div>
                <Label htmlFor="source-office">Request From Office</Label>
                <Select
                  value={parentOfficeId ? parentOfficeId.toString() : ""}
                  onValueChange={(value) => setParentOfficeId(parseInt(value, 10))}
                  disabled={officeOptions.length <= 1}
                >
                  <SelectTrigger id="source-office" className="mt-2">
                    <SelectValue placeholder="Select source office" />
                  </SelectTrigger>
                  <SelectContent>
                    {officeOptions.map((office) => (
                      <SelectItem key={office.id} value={office.id.toString()}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="context">Need / Context (Optional)</Label>
                <Textarea
                  id="context"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add context to guide AI recommendations. For example:
- Preparing for upcoming projects
- Seasonal needs
- Known upcoming requirements
- Budget constraints"
                  rows={5}
                  className="mt-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="lg"
                  onClick={handleSuggest}
                  disabled={suggestionMutation.isPending || !parentOfficeId}
                >
                  {suggestionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Your Data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get Recommendations
                    </>
                  )}
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/requisitions")}>
                  View All Requisitions
                </Button>
              </div>

              {aiUnavailableHint && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">{aiUnavailableHint}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Recommended Items
                </CardTitle>
                {suggestionSummary && (
                  <CardDescription className="text-xs sm:text-sm mt-2">
                    {suggestionSummary}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div 
                      key={suggestion.itemId} 
                      className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-slate-900">{suggestion.itemName}</p>
                        <Badge className="bg-amber-100 text-amber-900">
                          Qty: {suggestion.quantity}
                        </Badge>
                      </div>
                      {suggestion.rationale && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {suggestion.rationale}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-2">
                  {canCreate && (
                    <Button 
                      size="sm"
                      onClick={handleCreateFromRecommendations}
                    >
                      Create from Recommendations
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSuggestions([]);
                      setSuggestionSummary("");
                      setReason("");
                    }}
                  >
                    Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-blue-900">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 text-sm text-blue-800">
              <p>
                <span className="font-semibold">Our AI analyzes:</span>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Your current inventory levels and status</li>
                <li>Historical requisition patterns</li>
                <li>Item usage trends</li>
                <li>Your office's specific context (if provided)</li>
              </ul>
              <p>
                <span className="font-semibold">To generate recommendations for:</span>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Items you may need soon based on usage patterns</li>
                <li>Optimal quantities to request</li>
                <li>Preventive stock for critical items</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
