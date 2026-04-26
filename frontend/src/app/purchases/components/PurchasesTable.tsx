import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX, Eye, Download, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Purchase } from "@/services/purchaseService";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface PurchasesTableProps {
  data: Purchase[];
  isLoading: boolean;
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-64">
        <div className="flex flex-col items-center justify-center text-center space-y-3 px-4">
          <FileX className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <p className="text-xs sm:text-sm text-gray-500 max-w-md">
            No purchases found. Create a new purchase to record item acquisitions.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

const downloadPurchasePDF = (purchase: Purchase) => {
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

export function PurchasesTable({
  data,
  isLoading,
}: PurchasesTableProps) {
  const router = useRouter();
  
  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
      <Table>
        <TableCaption className="text-xs sm:text-sm">
          {!isLoading && `Total: ${data.length} purchase${data.length !== 1 ? 's' : ''}`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap">ID</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Supplier</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Invoice No.</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Purchase Date</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Items</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Total Amount</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">Purchased By</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              <LoadingRow />
              <LoadingRow />
              <LoadingRow />
            </>
          ) : data.length === 0 ? (
            <EmptyState />
          ) : (
            data.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium text-xs sm:text-sm">{purchase.id}</TableCell>
                <TableCell className="text-xs sm:text-sm">{purchase.supplier}</TableCell>
                <TableCell className="text-xs sm:text-sm hidden md:table-cell">{purchase.invoiceNumber || '-'}</TableCell>
                <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                  {new Date(purchase.purchasedDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs sm:text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span>{purchase.totalItems} item{purchase.totalItems !== 1 ? 's' : ''}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                  ৳{purchase.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs sm:text-sm hidden xl:table-cell">
                  <Link 
                    href={`/profile/${purchase.purchasedBy.id}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={purchase.purchasedBy.avatarUrl || ""} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(purchase.purchasedBy.name, purchase.purchasedBy.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{purchase.purchasedBy.name || purchase.purchasedBy.username}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 sm:gap-3">
                    <Eye
                      className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => router.push(`/purchases/${purchase.id}`)}
                    />
                    <Download
                      className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-green-600 transition-colors"
                      onClick={() => downloadPurchasePDF(purchase)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
