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

const Actions = () => (
  <ActionButton path="/api/offices" type="add" label="Create Office" loadingText="Creating" payload={{}} />
);

const RowActions = ({ item, onView, onEdit }: { item: Office, onView: (item: any) => void, onEdit: (item: any) => void }) => (
  <div className="flex gap-2">
    <Eye
      className="w-5 h-5 cursor-pointer hover:text-blue-600"
      onClick={() => onView(item)}
    />
    <Pencil
      className="w-5 h-5 cursor-pointer hover:text-green-600"
      onClick={() => onEdit(item)}
    />
  </div>
);

function Body({ data }: { data: Office[] }){
  const { handleView, handleEdit } = useTableActions("/offices");

  return(
    <>
    <div className="mx-auto my-8 max-w-7xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Bengali Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.nameBn || '-'}</TableCell>
            <TableCell className="capitalize">{item.type}</TableCell>
            <TableCell>{item.code || '-'}</TableCell>
            <TableCell>{item.order || '-'}</TableCell>
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

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Offices" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view offices</CardDescription>
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
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (error) {
    return (
      <PageLayout
        header={<Header title="Offices" subtitle="Error loading offices" />}
        body={<div className="flex justify-center items-center h-64 text-red-600">Error loading offices</div>}
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
              actions={<Actions />}
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























































