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
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useTableActions } from "@/hooks/useTableActions";
import { useCategories, Category } from "@/services/categoryService";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateByRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const searchConfig = {
  placeholder: "Search categories...",
  searchKeys: ["name", "description"],
};

const filterConfigs: any[] = [];

const paginationConfig = {
  itemsPerPage: 10,
  showEllipsis: true,
  maxVisiblePages: 5,
};

const Actions = () => {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/categories/new")} className="w-full sm:w-auto text-sm sm:text-base">
      Create Category
    </Button>
  );
};

const RowActions = ({ item, onView, onEdit }: { item: Category, onView: (item: any) => void, onEdit: (item: any) => void }) => (
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

function Body({ data }: { data: Category[] }){
  const { handleView, handleEdit } = useTableActions("/categories");

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <p className="text-gray-500 text-sm sm:text-base">No categories found</p>
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
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Description</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-xs sm:text-sm font-medium">{item.name}</TableCell>
              <TableCell className="text-xs sm:text-sm hidden md:table-cell">{item.description || '-'}</TableCell>
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

export default function CategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filteredData, setFilteredData] = useState<Category[]>([]);
  const [searchedData, setSearchedData] = useState<Category[]>([]);
  const [paginatedData, setPaginatedData] = useState<Category[]>([]);

  const { data: categories = [], isLoading, error } = useCategories();
  const canCreate = canCreateByRole(user?.role);

  useEffect(() => {
    setFilteredData(categories);
  }, [categories]);

  if (!user) {
    return (
      <PageLayout
        header={<Header title="Categories" subtitle="" />}
        body={
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Authentication Required</CardTitle>
                <CardDescription className="text-sm sm:text-base">Please log in to view categories</CardDescription>
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
        header={<Header title="Categories" subtitle="Loading categories..." />}
        body={<div className="flex justify-center items-center h-48 sm:h-64 text-sm sm:text-base">Loading...</div>}
      />
    );
  }

  if (error) {
    return (
      <PageLayout
        header={<Header title="Categories" subtitle="Error loading categories" />}
        body={<div className="flex justify-center items-center h-48 sm:h-64 text-red-600 text-sm sm:text-base">Error loading categories</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Categories"
          subtitle="Manage inventory categories"
          searchbar={
            <Search
              data={filteredData}
              config={searchConfig}
              onSearchedData={setSearchedData}
            />
          }
          filters={
            <Filter
              data={categories}
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
          data={searchedData.length > 0 ? searchedData : filteredData}
          config={paginationConfig}
          onPaginatedData={setPaginatedData}
        />
      }
    />
  );
}
