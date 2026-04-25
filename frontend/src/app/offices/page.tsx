"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  PageLayout,
  Header
} from "@/components/page";

import { FilterGroup as Filter } from "@/components/filters";
import { SearchGroup as Search } from "@/components/search";
import { PaginationGroup as Pagination } from "@/components/pagination";
import { ActionButton } from "@/components/actions";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil } from "lucide-react";
import { useTableActions } from "@/hooks/useTableActions";
import { useChildOffices } from "@/services/officeService";
import { Office } from "@/services/officeService";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateByRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const searchConfig = {
  placeholder: "Search offices...",
  searchKeys: ["name", "nameBn", "code", "description"],
};

const filterConfigs = [
  {
    key: "type",
    options: [
      { label: "All Types", value: "all" },
      { label: "Office", value: "office" },
      { label: "Faculty", value: "faculty" },
      { label: "Department", value: "department" },
      { label: "Center", value: "center" },
      { label: "Institute", value: "institute" },
      { label: "Hall", value: "hall" },
      { label: "Facility", value: "facility" },
    ],
  },
  {
    key: "isActive",
    options: [
      { label: "All Statuses", value: "all" },
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  },
];

const paginationConfig = {
  itemsPerPage: 10,
  showEllipsis: true,
  maxVisiblePages: 5,
};

const Actions = () => {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/offices/new")} className="w-full sm:w-auto text-sm sm:text-base">
      Create Office
    </Button>
  );
};

const RowActions = ({ item, onView, onEdit }: { item: Office, onView: (item: any) => void, onEdit: (item: any) => void }) => (
  <div className="flex gap-2 sm:gap-3">
    <Eye
      className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-blue-600 transition-colors"
      onClick={() => onView(item)}
    />
    <Pencil
      className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-green-600 transition-colors"
      onClick={() => onEdit(item)}
    />
  </div>
);

function Body({ data }: { data: Office[] }){
  const { handleView, handleEdit } = useTableActions("/offices");

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <p className="text-gray-500 text-sm sm:text-base">No child offices found</p>
        </div>
      </div>
    );
  }

  return(
    <>
    <div className="mx-auto my-4 sm:my-6 md:my-8 max-w-7xl">
      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Name</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Bengali Name</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Type</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Code</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">Order</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-xs sm:text-sm font-medium">{item.name}</TableCell>
              <TableCell className="text-xs sm:text-sm hidden md:table-cell">{item.nameBn || '-'}</TableCell>
              <TableCell className="text-xs sm:text-sm capitalize">{item.type}</TableCell>
              <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{item.code || '-'}</TableCell>
              <TableCell className="text-xs sm:text-sm hidden xl:table-cell">{item.order || '-'}</TableCell>
              <TableCell>
                <RowActions
                  item={item}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              </TableCell>
            </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  )
}

export default function OfficesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filteredData, setFilteredData] = useState<Office[]>([]);
  const [searchedData, setSearchedData] = useState<Office[]>([]);
  const [paginatedData, setPaginatedData] = useState<Office[]>([]);

  // Get child offices of current user's office
  const userOfficeId = user?.officeId ? parseInt(user.officeId) : 0;
  const { data: offices = [], isLoading, error } = useChildOffices(userOfficeId);
  const canCreate = canCreateByRole(user?.role);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Offices" subtitle="" />}
        body={
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Authentication Required</CardTitle>
                <CardDescription className="text-sm sm:text-base">Please log in to view offices</CardDescription>
              </CardHeader>
            </Card>
          </div>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <PageLayout
        header={<Header title="Offices" subtitle="Loading offices..." />}
        body={<div className="flex justify-center items-center h-48 sm:h-64 text-sm sm:text-base">Loading...</div>}
      />
    );
  }

  if (error) {
    return (
      <PageLayout
        header={<Header title="Offices" subtitle="Error loading offices" />}
        body={<div className="flex justify-center items-center h-48 sm:h-64 text-red-600 text-sm sm:text-base">Error loading offices</div>}
      />
    );
  }

  return (
    <PageLayout
          header={
            <Header
              title="Offices"
              subtitle="Manage university offices and departments"
              searchbar={
                <Search
                  data={filteredData}
                  config={searchConfig}
                  onSearchedData={setSearchedData}
                />
              }
              filters={
                <Filter
                  data={offices}
                  filters={filterConfigs}
                  onFilteredData={setFilteredData}
                />
              }
              actions={canCreate ? <Actions /> : null}
            />
          }
          body={<Body data={paginatedData} />}
          footer={
            <Pagination
              data={searchedData}
              config={paginationConfig}
              onPaginatedData={setPaginatedData}
            />
          }
    />
  );
}























































