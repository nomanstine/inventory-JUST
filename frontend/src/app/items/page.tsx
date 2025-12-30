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
import { useItems, Item } from "@/services/itemService";
import { useCategories } from "@/services/categoryService";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const searchConfig = {
  placeholder: "Search items...",
  searchKeys: ["name", "description"],
};

const paginationConfig = {
  itemsPerPage: 10,
  showEllipsis: true,
  maxVisiblePages: 5,
};

const Actions = () => (
  <ActionButton path="/api/items" type="add" label="Create Item" loadingText="Creating" payload={{}} />
);

const RowActions = ({ item, onView, onEdit }: { item: Item, onView: (item: any) => void, onEdit: (item: any) => void }) => (
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

function Body({ data }: { data: Item[] }){
  const { handleView, handleEdit } = useTableActions("/items");

  return(
    <>
    <div className="mx-auto my-8 max-w-7xl">
      <Table>
        <TableCaption>A list of inventory items.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.id}</TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              {item.category ? (
                <Badge variant="outline">{item.category.name}</Badge>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              {item.unit ? (
                <Badge variant="secondary">{item.unit.name}</Badge>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {item.description || '-'}
            </TableCell>
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

export default function ItemsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [filteredData, setFilteredData] = useState<Item[]>([]);
  const [searchedData, setSearchedData] = useState<Item[]>([]);
  const [paginatedData, setPaginatedData] = useState<Item[]>([]);

  const { data: items = [], isLoading, error } = useItems();
  const { data: categories = [] } = useCategories();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    setFilteredData(items);
  }, [items]);

  // Create filter configs from categories
  const filterConfigs = [
    {
      key: "category.name",
      options: [
        { label: "All Categories", value: "all" },
        ...categories.map(cat => ({
          label: cat.name,
          value: cat.name
        }))
      ],
    },
  ];

  if (isLoading) {
    return (
      <PageLayout
        header={<Header title="Items" subtitle="Loading items..." />}
        body={<div className="flex justify-center items-center h-64">Loading...</div>}
      />
    );
  }

  if (error) {
    return (
      <PageLayout
        header={<Header title="Items" subtitle="Error loading items" />}
        body={<div className="flex justify-center items-center h-64 text-red-600">Error loading items</div>}
      />
    );
  }

  return (
    <PageLayout
      header={
        <Header
          title="Items"
          subtitle="Manage inventory items"
          searchbar={
            <Search
              data={filteredData}
              config={searchConfig}
              onSearchedData={setSearchedData}
            />
          }
          filters={
            <Filter
              data={items}
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
