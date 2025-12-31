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
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useTableActions } from "@/hooks/useTableActions";
import { useUnits, Unit } from "@/services/unitService";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const searchConfig = {
  placeholder: "Search units...",
  searchKeys: ["name", "description"],
};

const filterConfigs: any[] = [];

const paginationConfig = {
  itemsPerPage: 10,
  showEllipsis: true,
  maxVisiblePages: 5,
};

const Actions = () => (
  <ActionButton path="/api/units" type="add" label="Create Unit" loadingText="Creating" payload={{}} />
);

const RowActions = ({ item, onView, onEdit }: { item: Unit, onView: (item: any) => void, onEdit: (item: any) => void }) => (
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

function Body({ data }: { data: Unit[] }){
  const { handleView, handleEdit } = useTableActions("/units");

  return(
    <>
    <div className="mx-auto my-8 max-w-7xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.description || '-'}</TableCell>
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

export default function UnitsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filteredData, setFilteredData] = useState<Unit[]>([]);
  const [searchedData, setSearchedData] = useState<Unit[]>([]);
  const [paginatedData, setPaginatedData] = useState<Unit[]>([]);

  const { data: units = [], isLoading, error } = useUnits();

  useEffect(() => {
    setFilteredData(units);
  }, [units]);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Units" subtitle="" />}
        body={
          <div className="flex items-center justify-center h-[50vh]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view units</CardDescription>
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
        header={<Header title="Units" subtitle="Loading units..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (error) {
    return (
      <PageLayout
        header={<Header title="Units" subtitle="Error loading units" />}
        body={<div className="flex justify-center items-center h-64 text-red-600">Error loading units</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Units"
          subtitle="Manage measurement units"
          searchbar={
            <Search
              data={filteredData}
              config={searchConfig}
              onSearchedData={setSearchedData}
            />
          }
          filters={
            <Filter
              data={units}
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
          data={searchedData.length > 0 ? searchedData : filteredData}
          config={paginationConfig}
          onPaginatedData={setPaginatedData}
        />
      }
    />
  );
}
