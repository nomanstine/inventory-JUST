import serviceFactory from "@/services/serviceFactory";

export interface Unit {
  id: number;
  name: string;
  description?: string;
}

export interface UnitForm {
  name: string;
  description?: string;
}

const unitService = serviceFactory<Unit, UnitForm>("/units");

export const getUnits = unitService.getAll;
export const getUnitById = unitService.getById;
export const createUnit = unitService.create;
export const updateUnit = unitService.update;
export const deleteUnit = unitService.delete;
