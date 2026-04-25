import serviceFactory from "@/services/serviceFactory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";


export interface Office {
  id: number;
  name: string;
  nameBn?: string;
  type: string;
  code?: string;
  description?: string;
  order?: number;
  isActive: boolean;
  parent?: Office;
  subOffices?: Office[];
}
export interface OfficeForm {
  name: string;
  nameBn?: string;
  type: string;
  code?: string;
  description?: string;
  order?: number;
  isActive: boolean;
  parentId?: number;
}

const officeService = serviceFactory<Office, OfficeForm>("/offices");

export const getOffices = officeService.getAll;
export const getOfficeById = officeService.getById;

const toOfficePayload = (data: Partial<OfficeForm>) => ({
  name: data.name,
  nameBn: data.nameBn,
  type: data.type,
  code: data.code,
  description: data.description,
  order: data.order,
  isActive: data.isActive,
  parent: data.parentId ? { id: data.parentId } : null,
});

export const createOffice = async (data: OfficeForm): Promise<Office> => {
  const response = await api.post("/offices", toOfficePayload(data));
  return response.data;
};

export const updateOffice = async (id: number, data: Partial<OfficeForm>): Promise<Office> => {
  const response = await api.put(`/offices/${id}`, toOfficePayload(data));
  return response.data;
};
export const deleteOffice = officeService.delete;

// Get child offices by parent ID
export const getChildOffices = async (parentId: number): Promise<Office[]> => {
  const response = await api.get(`/offices/children/${parentId}`);
  return response.data;
};

// React Query Hooks
export const useOffices = () => {
  return useQuery({
    queryKey: ['offices'],
    queryFn: getOffices,
  });
};

export const useChildOffices = (parentId: number) => {
  return useQuery({
    queryKey: ['offices', 'children', parentId],
    queryFn: () => getChildOffices(parentId),
    enabled: !!parentId,
  });
};

export const useOffice = (id: number) => {
  return useQuery({
    queryKey: ['offices', id],
    queryFn: () => getOfficeById(id),
    enabled: !!id,
  });
};

export const useCreateOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });
};

export const useUpdateOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OfficeForm> }) =>
      updateOffice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });
};

export const useDeleteOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });
};