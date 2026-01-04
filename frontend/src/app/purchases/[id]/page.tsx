"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout, Header } from "@/components/page";
import { usePurchase } from "@/services/purchaseService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, FileText, Calendar, User, Building, DollarSign, Download, Receipt as ReceiptIcon, ExternalLink, Hash, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getOptimizedImageUrl, downloadFile } from "@/lib/cloudinary";
import { BarcodePrintDialog } from "@/components/BarcodePrintDialog";

export default function PurchaseDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const purchaseId = parseInt(params.id as string);
  
  const { data: purchase, isLoading, error } = usePurchase(purchaseId);
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<{ itemInstanceId: number; barcode: string; itemName: string; }[]>([]);

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
      const itemsSection = purchase.items.map((item, index) => 
        `${index + 1}. ${item.item.name} - Qty: ${item.quantity}, Unit Price: ৳${item.unitPrice.toFixed(2)}, Total: ৳${item.totalPrice.toFixed(2)}`
      ).join('\n');

      const doc = `
PURCHASE RECEIPT
${'='.repeat(50)}

Purchase ID: ${purchase.id}
Date: ${new Date(purchase.purchasedDate).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

PURCHASE DETAILS
${'-'.repeat(50)}
Supplier: ${purchase.supplier}
${purchase.invoiceNumber ? `Invoice Number: ${purchase.invoiceNumber}` : ''}
${purchase.remarks ? `Remarks: ${purchase.remarks}` : ''}

ITEMS
${'-'.repeat(50)}
${itemsSection}

TOTAL SUMMARY
${'-'.repeat(50)}
Total Items: ${purchase.totalItems}
Total Amount: ৳${purchase.totalAmount.toFixed(2)}

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

  return (
    <>
      <PageLayout
        header={
        <Header 
          title={`Purchase #${purchase.id}`}
          subtitle="Complete purchase details with all items"
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
        <div className="mx-auto my-8 max-w-5xl space-y-6">
          {/* Purchase Header Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{purchase.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    Invoice Number
                  </p>
                  <p className="font-medium">{purchase.invoiceNumber || '-'}</p>
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
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Office
                  </p>
                  <p className="font-medium">{purchase.office.name}</p>
                </div>
              </div>
              
              {purchase.remarks && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="font-medium mt-1">{purchase.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Purchased Items
                  </CardTitle>
                  <CardDescription>
                    {purchase.totalItems} item{purchase.totalItems !== 1 ? 's' : ''} in this purchase
                  </CardDescription>
                </div>
                {purchase.items.some(item => item.itemInstanceIds && item.itemInstanceIds.length > 0) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const allInstances: { itemInstanceId: number; barcode: string; itemName: string; }[] = [];
                      purchase.items.forEach((item: any) => {
                        if (item.itemInstanceIds && item.itemBarcodes) {
                          item.itemInstanceIds.forEach((id: number, index: number) => {
                            allInstances.push({
                              itemInstanceId: id,
                              barcode: item.itemBarcodes[index],
                              itemName: item.item.name
                            });
                          });
                        }
                      });
                      setBarcodeItems(allInstances);
                      setShowBarcodeDialog(true);
                    }}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Print All Barcodes
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">৳{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">৳{item.totalPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {item.itemInstanceIds && item.itemInstanceIds.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const instances = item.itemInstanceIds!.map((id, idx) => ({
                                itemInstanceId: id,
                                barcode: item.itemBarcodes![idx],
                                itemName: item.item.name
                              }));
                              setBarcodeItems(instances);
                              setShowBarcodeDialog(true);
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 dark:bg-blue-950 font-semibold">
                    <TableCell colSpan={5} className="text-right">Grand Total</TableCell>
                    <TableCell className="text-right text-lg text-blue-600">
                      ৳{purchase.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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

          {/* Purchaser Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Purchaser Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-gray-500">Purchased By</p>
                <Link 
                  href={`/profile/${purchase.purchasedBy.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-lg"
                >
                  {purchase.purchasedBy.name || purchase.purchasedBy.username}
                </Link>
              </div>
            </CardContent>
          </Card>
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
