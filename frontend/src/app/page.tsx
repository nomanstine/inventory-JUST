"use client";
import { useState } from "react";

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

const tData = [
            {"id": 1, "name": "John", "age": 28, "status": "active", "department": "Engineering"},
            {"id": 2, "name": "Jane", "age": 32, "status": "inactive", "department": "Marketing"},
            {"id": 3, "name": "Bob", "age": 45, "status": "active", "department": "Engineering"},
            {"id": 4, "name": "Alice", "age": 29, "status": "inactive", "department": "Sales"},
            {"id": 5, "name": "Charlie", "age": 35, "status": "active", "department": "Marketing"},
            {"id": 6, "name": "David", "age": 41, "status": "active", "department": "Engineering"},
            {"id": 7, "name": "Emma", "age": 27, "status": "inactive", "department": "HR"},
            {"id": 8, "name": "Frank", "age": 38, "status": "active", "department": "Sales"},
            {"id": 9, "name": "Grace", "age": 33, "status": "active", "department": "Marketing"},
            {"id": 10, "name": "Henry", "age": 42, "status": "inactive", "department": "Engineering"},
            {"id": 11, "name": "Ivy", "age": 30, "status": "active", "department": "HR"},
            {"id": 12, "name": "Jack", "age": 36, "status": "active", "department": "Sales"},
            {"id": 13, "name": "Kelly", "age": 31, "status": "inactive", "department": "Marketing"},
            {"id": 14, "name": "Leo", "age": 39, "status": "active", "department": "Engineering"},
            {"id": 15, "name": "Mia", "age": 26, "status": "active", "department": "HR"},
        ];

type DataItem = typeof tData[0];

const searchConfig = {
  placeholder: "Search...",
  searchKeys: ["name", "department"],
};

const filterConfigs = [
  {
    key: "status",
    options: [
      { label: "All Statuses", value: "all" },
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  {
    key: "department",
    options: [
      { label: "All Departments", value: "all" },
      { label: "Engineering", value: "Engineering" },
      { label: "Marketing", value: "Marketing" },
      { label: "Sales", value: "Sales" },
      { label: "HR", value: "HR" },
    ],
  },
];

const paginationConfig = {
  itemsPerPage: 5,
  showEllipsis: true,
  maxVisiblePages: 5,
};

const Actions = () => (
  <ActionButton path="/api/items" type="add" label="Create" loadingText="Creating" payload={{"name" : "noman"}} />
);


const RowActions = ({ item, onView, onEdit }: { item: DataItem, onView: (item: any) => void, onEdit: (item: any) => void }) => (
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

function Body({ data }: { data: DataItem[] }){
  const { handleView, handleEdit } = useTableActions("/dashboard");

  return(
    <>
    <div className="mx-auto my-8 max-w-6xl flex justify-center items-center">
      <Table>
        <TableCaption>A list of items.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.age}</TableCell>
            <TableCell>{item.status}</TableCell>
            <TableCell>{item.department}</TableCell>
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

export default function Dashboard() {
  const [filteredData, setFilteredData] = useState<DataItem[]>(tData);
  const [searchedData, setSearchedData] = useState<DataItem[]>(tData);
  const [paginatedData, setPaginatedData] = useState<DataItem[]>(tData);

  return (
    <PageLayout
          header={
            <Header 
              title="Dashboard" 
              subtitle="Welcome to your dashboard" 
              searchbar={
                <Search 
                  data={filteredData}
                  config={searchConfig}
                  onSearchedData={setSearchedData}
                />
              } 
              filters={
                <Filter 
                  data={tData}
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























































