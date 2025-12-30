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
import { FileX, Eye, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Purchase } from "@/services/purchaseService";
import { toast } from "sonner";

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
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={9} className="h-64">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <FileX className="h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-500 max-w-md">
            No purchases found. Create a new purchase to record item acquisitions.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

const downloadPurchasePDF = (purchase: Purchase) => {
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

export function PurchasesTable({
  data,
  isLoading,
}: PurchasesTableProps) {
  const router = useRouter();
  
  return (
    <Table>
      <TableCaption>
        {!isLoading && `Total: ${data.length} purchase${data.length !== 1 ? 's' : ''}`}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Purchase Date</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Purchased By</TableHead>
          <TableHead>Actions</TableHead>
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
              <TableCell className="font-medium">{purchase.id}</TableCell>
              <TableCell>{purchase.item.name}</TableCell>
              <TableCell>{purchase.supplier}</TableCell>
              <TableCell>
                {new Date(purchase.purchasedDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{purchase.quantity}</TableCell>
              <TableCell>৳{purchase.unitPrice.toFixed(2)}</TableCell>
              <TableCell>
                ৳{(purchase.quantity * purchase.unitPrice).toFixed(2)}
              </TableCell>
              <TableCell>
                <Link 
                  href={`/profile/${purchase.purchasedBy.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {purchase.purchasedBy.name || purchase.purchasedBy.username}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Eye
                    className="w-5 h-5 cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/purchases/${purchase.id}`)}
                  />
                  <Download
                    className="w-5 h-5 cursor-pointer hover:text-green-600"
                    onClick={() => downloadPurchasePDF(purchase)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
