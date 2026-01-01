"use client";
import { useParams, useRouter } from "next/navigation";
import { PageLayout, Header } from "@/components/page";
import { usePurchase } from "@/services/purchaseService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, FileText, Calendar, User, Building, DollarSign, Download, Receipt as ReceiptIcon, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getOptimizedImageUrl, downloadFile } from "@/lib/cloudinary";

export default function PurchaseDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const purchaseId = parseInt(params.id as string);
  
  const { data: purchase, isLoading, error } = usePurchase(purchaseId);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Purchase Details" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view purchase details</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  const downloadPurchasePDF = () => {
    if (!purchase) return;
    
    try {
      const doc = `
PURCHASE RECEIPT
${'='.repeat(50)}

Purchase ID: ${purchase.id}
Date: ${new Date(purchase.purchasedDate).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

ITEM INFORMATION
${'-'.repeat(50)}
Item Name: ${purchase.item.name}
Item ID: ${purchase.item.id}

PURCHASE DETAILS
${'-'.repeat(50)}
Supplier: ${purchase.supplier}
Quantity: ${purchase.quantity}
Unit Price: ৳${purchase.unitPrice.toFixed(2)}
Total Amount: ৳${(purchase.quantity * purchase.unitPrice).toFixed(2)}
${purchase.remarks ? `\nRemarks: ${purchase.remarks}` : ''}

OFFICE INFORMATION
${'-'.repeat(50)}
Office: ${purchase.office.name}
Purchased By: ${purchase.purchasedBy.name || purchase.purchasedBy.username}

${'='.repeat(50)}
Generated on: ${new Date().toLocaleString()}
      `;

      const blob = new Blob([doc], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-${purchase.id}-${new Date().getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Purchase receipt downloaded');
    } catch (error) {
      console.error('Failed to download purchase receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!purchase?.receiptUrl) return;
    
    try {
      const isPdf = purchase.receiptUrl.toLowerCase().endsWith('.pdf');
      const extension = isPdf ? 'pdf' : 'jpg';
      const filename = `receipt-purchase-${purchase.id}.${extension}`;
      
      await downloadFile(purchase.receiptUrl, filename);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  if (isLoading) {
    return (
      <PageLayout
        header={<Header title="Purchase Details" subtitle="Loading..." />}
        body={
          <div className="mx-auto my-8 max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        }
      />
    );
  }

  if (error || !purchase) {
    return (
      <PageLayout
        header={<Header title="Purchase Details" subtitle="Error loading purchase" />}
        body={
          <div className="mx-auto my-8 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription>Failed to load purchase details</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/purchases")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Purchases
                </Button>
              </CardContent>
            </Card>
          </div>
        }
      />
    );
  }

  const totalAmount = purchase.quantity * purchase.unitPrice;

  return (
    <PageLayout
      header={
        <Header 
          title={`Purchase #${purchase.id}`}
          subtitle="Complete purchase details"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadPurchasePDF}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" onClick={() => router.push("/purchases")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          }
        />
      }
      body={
        <div className="mx-auto my-8 max-w-4xl space-y-6">
          {/* Item Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Item Name</p>
                  <p className="font-medium">{purchase.item.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Item ID</p>
                  <p className="font-medium">{purchase.item.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{purchase.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Purchase Date
                  </p>
                  <p className="font-medium">
                    {new Date(purchase.purchasedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium text-lg">{purchase.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Unit Price
                  </p>
                  <p className="font-medium text-lg">৳{purchase.unitPrice.toFixed(2)}</p>
                </div>
              </div>
              
              {purchase.remarks && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="font-medium mt-1">{purchase.remarks}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-lg font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">৳{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Display */}
          {purchase.receiptUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptIcon className="h-5 w-5" />
                  Receipt / Invoice Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchase.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="h-12 w-12 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">PDF Receipt</p>
                            <p className="text-sm text-gray-500">Click to view the receipt document</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => window.open(purchase.receiptUrl, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open PDF
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleDownloadReceipt}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={getOptimizedImageUrl(purchase.receiptUrl, 800, undefined, 85)}
                          alt="Purchase receipt"
                          className="w-full h-auto"
                          onClick={() => window.open(purchase.receiptUrl, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => window.open(purchase.receiptUrl, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Full Size
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleDownloadReceipt}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Office and User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Office & Purchaser Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Office</p>
                  <p className="font-medium">{purchase.office.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Purchased By
                  </p>
                  <Link 
                    href={`/profile/${purchase.purchasedBy.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {purchase.purchasedBy.name || purchase.purchasedBy.username}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
