import serviceFactory from "@/services/serviceFactory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Item {
  id: number;
  name: string;
  description?: string;
  category?: {
    id: number;
    name: string;
    description?: string;
  };
  unit?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface ItemForm {
  name: string;
  description?: string;
  categoryId?: number;
  unitId?: number;
  price?: number;
}

const itemService = serviceFactory<Item, ItemForm>("/items");

export const getItems = itemService.getAll;
export const getItemById = itemService.getById;
export const createItem = itemService.create;
export const updateItem = itemService.update;
export const deleteItem = itemService.delete;

// React Query Hooks
export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: getItems,
  });
};

export const useItem = (id: number) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => getItemById(id),
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ItemForm> }) =>
      updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
