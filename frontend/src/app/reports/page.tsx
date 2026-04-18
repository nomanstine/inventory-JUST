"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  BarChart3,
} from "lucide-react";
import {
  getMyOfficeInventory,
  getMyOfficeInventorySummary,
  getMyOfficePurchases,
  getMyOfficeTransactionHistory,
} from "@/services/inventoryService";
import { getHistoryRequests } from "@/services/itemRequestService";

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

interface GeneratedReport {
  id: string;
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

const reportCategories = [
  { value: "all", label: "All Reports" },
  { value: "inventory", label: "Inventory" },
  { value: "transactions", label: "Transactions" },
  { value: "purchases", label: "Purchases" },
  { value: "requests", label: "Requests" },
];

const availableReports: ReportCard[] = [
  {
    id: "inventory-items",
    title: "Inventory Items",
    description: "All items in your office inventory",
    icon: <Package className="w-6 h-6 text-blue-600" />,
    category: "inventory",
  },
  {
    id: "inventory-status-summary",
    title: "Inventory Status Summary",
    description: "Inventory totals and status counts",
    icon: <BarChart3 className="w-6 h-6 text-green-600" />,
    category: "inventory",
  },
  {
    id: "transaction-history",
    title: "Transaction History",
    description: "Complete movement history for your office",
    icon: <ArrowRightLeft className="w-6 h-6 text-cyan-600" />,
    category: "transactions",
  },
  {
    id: "purchase-summary",
    title: "Purchase Summary",
    description: "All purchases and total amount details",
    icon: <ShoppingCart className="w-6 h-6 text-green-600" />,
    category: "purchases",
  },
  {
    id: "requests-history",
    title: "Item Requests Report",
    description: "All requests and fulfillment status",
    icon: <FileText className="w-6 h-6 text-orange-600" />,
    category: "requests",
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== "number") return "-";
    return value.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  const isInDateRange = (value?: string) => {
    if (!value) return false;
    const reportDate = new Date(value);
    if (Number.isNaN(reportDate.getTime())) return false;

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    if (start && reportDate < start) return false;
    if (end && reportDate > end) return false;
    return true;
  };

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Reports" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view reports</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  const filteredReports = availableReports.filter((report) => {
    const matchesCategory = selectedCategory === "all" || report.category === selectedCategory;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateReport = async (report: ReportCard) => {
    try {
      setGeneratingReportId(report.id);

      if (report.id === "inventory-items") {
        const inventoryItems = await getMyOfficeInventory();
        const filtered = (startDate || endDate)
          ? inventoryItems.filter((item) => isInDateRange(item.purchaseDate))
          : inventoryItems;

        setGeneratedReport({
          id: report.id,
          title: report.title,
          columns: [
            "Barcode",
            "Item",
            "Category",
            "Office",
            "Status",
            "Condition",
            "Purchase Date",
            "Purchase Price",
          ],
          rows: filtered.map((item) => ({
            Barcode: item.barcode,
            Item: item.item?.name ?? "-",
            Category: item.item?.category?.name ?? "-",
            Office: item.ownerOffice?.name ?? "-",
            Status: item.status,
            Condition: item.condition ?? "-",
            "Purchase Date": formatDate(item.purchaseDate),
            "Purchase Price": formatCurrency(item.purchasePrice),
          })),
        });
      } else if (report.id === "inventory-status-summary") {
        const summary = await getMyOfficeInventorySummary();
        const statusRows = Object.entries(summary.itemsByStatus || {}).map(([status, count]) => ({
          Metric: `Status - ${status}`,
          Value: count,
        }));
        const categoryRows = Object.entries(summary.itemsByCategory || {}).map(([category, count]) => ({
          Metric: `Category - ${category}`,
          Value: count,
        }));

        setGeneratedReport({
          id: report.id,
          title: report.title,
          columns: ["Metric", "Value"],
          rows: [
            { Metric: "Total Items", Value: summary.totalItems },
            { Metric: "Total Value", Value: formatCurrency(summary.totalValue) },
            ...statusRows,
            ...categoryRows,
          ],
        });
      } else if (report.id === "transaction-history") {
        const transactions = await getMyOfficeTransactionHistory();
        const filtered = (startDate || endDate)
          ? transactions.filter((txn) => isInDateRange(txn.transactionDate))
          : transactions;

        setGeneratedReport({
          id: report.id,
          title: report.title,
          columns: [
            "Date",
            "Item",
            "Barcode",
            "From Office",
            "To Office",
            "Type",
            "Quantity",
            "Status",
          ],
          rows: filtered.map((txn) => ({
            Date: formatDate(txn.transactionDate),
            Item: txn.itemInstance?.item?.name ?? "-",
            Barcode: txn.itemInstance?.barcode ?? "-",
            "From Office": txn.fromOffice?.name ?? "-",
            "To Office": txn.toOffice?.name ?? "-",
            Type: txn.transactionType,
            Quantity: txn.quantity,
            Status: txn.status,
          })),
        });
      } else if (report.id === "purchase-summary") {
        const purchases = await getMyOfficePurchases();
        const filtered = (startDate || endDate)
          ? purchases.filter((purchase) => isInDateRange(purchase.purchasedDate))
          : purchases;

        setGeneratedReport({
          id: report.id,
          title: report.title,
          columns: ["Date", "Supplier", "Invoice", "Total Items", "Total Amount", "Purchased By"],
          rows: filtered.map((purchase) => ({
            Date: formatDate(purchase.purchasedDate),
            Supplier: purchase.supplier,
            Invoice: purchase.invoiceNumber ?? "-",
            "Total Items": purchase.totalItems,
            "Total Amount": formatCurrency(purchase.totalAmount),
            "Purchased By": purchase.purchasedBy?.fullName ?? purchase.purchasedBy?.username ?? "-",
          })),
        });
      } else if (report.id === "requests-history") {
        const requests = await getHistoryRequests();
        const filtered = (startDate || endDate)
          ? requests.filter((request) => isInDateRange(request.requestedDate))
          : requests;

        setGeneratedReport({
          id: report.id,
          title: report.title,
          columns: [
            "Requested Date",
            "Item",
            "Requested",
            "Approved",
            "Fulfilled",
            "Status",
            "Requesting Office",
            "Parent Office",
          ],
          rows: filtered.map((request) => ({
            "Requested Date": formatDate(request.requestedDate),
            Item: request.item?.name ?? "-",
            Requested: request.requestedQuantity,
            Approved: request.approvedQuantity ?? 0,
            Fulfilled: request.fulfilledQuantity ?? 0,
            Status: request.status,
            "Requesting Office": request.requestingOffice?.name ?? "-",
            "Parent Office": request.parentOffice?.name ?? "-",
          })),
        });
      }

      toast.success(`${report.title} generated successfully`);
    } catch (error) {
      setGeneratedReport(null);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleExportCsv = (reportId: string) => {
    if (!generatedReport || generatedReport.id !== reportId) {
      toast.info("Generate this report first before exporting.");
      return;
    }

    const { columns, rows, title } = generatedReport;
    const escapeCsv = (value: string | number) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = columns.join(",");
    const body = rows
      .map((row) => columns.map((column) => escapeCsv(row[column] ?? "")).join(","))
      .join("\n");
    const csvContent = `${header}\n${body}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout
      header={
        <Header
          title="Reports"
          subtitle="Generate and export various reports for inventory management"
        />
      }
      body={
        <div className="space-y-6">
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
              <CardDescription>Configure report parameters and date ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Reports</Label>
                  <Input
                    id="search"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {report.icon}
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {report.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => handleGenerateReport(report)}
                      className="w-full"
                      disabled={generatingReportId === report.id}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {generatingReportId === report.id ? "Generating..." : "Generate Report"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExportCsv(report.id)}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {generatedReport && (
            <Card>
              <CardHeader>
                <CardTitle>{generatedReport.title}</CardTitle>
                <CardDescription>
                  {generatedReport.rows.length} row{generatedReport.rows.length === 1 ? "" : "s"} returned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {generatedReport.columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedReport.rows.map((row, index) => (
                      <TableRow key={`${generatedReport.id}-${index}`}>
                        {generatedReport.columns.map((column) => (
                          <TableCell key={`${column}-${index}`}>{String(row[column] ?? "-")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {generatedReport.rows.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    No records found for the selected filters.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {filteredReports.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No reports found</h3>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}
