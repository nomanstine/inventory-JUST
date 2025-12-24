import serviceFactory from "@/services/serviceFactory";

const officeService = serviceFactory("/offices");

export const getOffices = officeService.getAll;
export const getOfficeById = officeService.getById;
export const createOffice = officeService.create;
export const updateOffice = officeService.update;
export const deleteOffice = officeService.delete;