"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PageLayout, Header } from "@/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FileSpreadsheet,
  Calendar,
  Package,
  TrendingUp,
  ShoppingCart,
  ArrowRightLeft,
  Users,
  BarChart3,
} from "lucide-react";

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const reportCategories = [
  { value: "all", label: "All Reports" },
  { value: "inventory", label: "Inventory" },
  { value: "transactions", label: "Transactions" },
  { value: "purchases", label: "Purchases" },
  { value: "requests", label: "Requests" },
  { value: "users", label: "Users" },
];

const availableReports: ReportCard[] = [
  {
    id: "inventory-summary",
    title: "Inventory Summary",
    description: "Overview of all items in inventory with status breakdown",
    icon: <Package className="w-6 h-6 text-blue-600" />,
    category: "inventory",
  },
  {
    id: "inventory-by-office",
    title: "Inventory by Office",
    description: "Item distribution across different offices",
    icon: <BarChart3 className="w-6 h-6 text-green-600" />,
    category: "inventory",
  },
  {
    id: "low-stock-items",
    title: "Low Stock Items",
    description: "Items below minimum stock threshold",
    icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
    category: "inventory",
  },
  {
    id: "item-status-report",
    title: "Item Status Report",
    description: "Detailed status of items (Available, In Use, Damaged, etc.)",
    icon: <FileText className="w-6 h-6 text-purple-600" />,
    category: "inventory",
  },
  {
    id: "transaction-history",
    title: "Transaction History",
    description: "Complete history of item movements between offices",
    icon: <ArrowRightLeft className="w-6 h-6 text-cyan-600" />,
    category: "transactions",
  },
  {
    id: "transaction-by-date",
    title: "Transactions by Date Range",
    description: "Filter transactions within a specific date range",
    icon: <Calendar className="w-6 h-6 text-indigo-600" />,
    category: "transactions",
  },
  {
    id: "purchase-summary",
    title: "Purchase Summary",
    description: "Overview of all purchases with cost analysis",
    icon: <ShoppingCart className="w-6 h-6 text-green-600" />,
    category: "purchases",
  },
  {
    id: "purchase-by-supplier",
    title: "Purchase by Supplier",
    description: "Breakdown of purchases grouped by supplier",
    icon: <FileSpreadsheet className="w-6 h-6 text-blue-600" />,
    category: "purchases",
  },
  {
    id: "item-requests",
    title: "Item Requests Report",
    description: "Status of all item requisitions (Pending, Approved, Rejected)",
    icon: <FileText className="w-6 h-6 text-orange-600" />,
    category: "requests",
  },
  {
    id: "request-fulfillment",
    title: "Request Fulfillment Rate",
    description: "Analysis of request approval and rejection rates",
    icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
    category: "requests",
  },
  {
    id: "user-activity",
    title: "User Activity Report",
    description: "Track user actions and system usage",
    icon: <Users className="w-6 h-6 text-pink-600" />,
    category: "users",
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleGenerateReport = (reportId: string) => {
    // TODO: Implement report generation logic
    console.log("Generating report:", reportId, { startDate, endDate });
    toast.info("Report generation will be implemented soon!");
  };

  const handleExportReport = (reportId: string, format: "pdf" | "excel") => {
    // TODO: Implement export logic
    console.log("Exporting report:", reportId, "as", format);
    toast.info(`Export as ${format.toUpperCase()} will be implemented soon!`);
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
                      onClick={() => handleGenerateReport(report.id)}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleExportReport(report.id, "pdf")}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExportReport(report.id, "excel")}
                        className="flex-1"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
