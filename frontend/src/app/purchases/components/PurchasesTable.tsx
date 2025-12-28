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
import { FileX } from "lucide-react";
import Link from "next/link";
import { Purchase } from "@/services/purchaseService";

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
    </TableRow>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-64">
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

export function PurchasesTable({
  data,
  isLoading,
}: PurchasesTableProps) {
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
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
