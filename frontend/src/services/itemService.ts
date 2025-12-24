import serviceFactory from "@/services/serviceFactory";

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
  price?: number;
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
