import serviceFactory from "@/services/serviceFactory";

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryForm {
  name: string;
  description?: string;
}

const categoryService = serviceFactory<Category, CategoryForm>("/categories");

export const getCategories = categoryService.getAll;
export const getCategoryById = categoryService.getById;
export const createCategory = categoryService.create;
export const updateCategory = categoryService.update;
export const deleteCategory = categoryService.delete;
