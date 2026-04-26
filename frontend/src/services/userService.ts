import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  fullName?: string;
  avatarUrl?: string | null;
  role: string | { id: string; name: string; description: string };
  permissions?: string[];
  office?: {
    id: string;
    name: string;
  };
  officeId?: string;
  officeName?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface OfficeAdminSummary {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  officeId: string;
  officeName: string;
  active: boolean;
  avatarUrl?: string | null;
}

export interface CreateOfficeAdminPayload {
  username: string;
  password: string;
  email: string;
  fullName: string;
  officeId: number;
}

export interface CreateOfficeUserPayload {
  username: string;
  password: string;
  email: string;
  fullName: string;
}

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const getOfficeAdmins = async (): Promise<OfficeAdminSummary[]> => {
  const response = await api.get(`/users/admins`);
  return response.data;
};

export const getOfficeUsers = async (): Promise<OfficeAdminSummary[]> => {
  const response = await api.get(`/users/office-users`);
  return response.data;
};

export const createOfficeAdmin = async (payload: CreateOfficeAdminPayload): Promise<OfficeAdminSummary> => {
  const response = await api.post(`/users/admins`, payload);
  return response.data;
};

export const createOfficeUser = async (payload: CreateOfficeUserPayload): Promise<OfficeAdminSummary> => {
  const response = await api.post(`/users/office-users`, payload);
  return response.data;
};

export const updateMyProfile = async (payload: UpdateProfilePayload): Promise<User> => {
  const response = await api.put(`/users/me/profile`, payload);
  return response.data;
};

export const deactivateUser = async (id: string): Promise<OfficeAdminSummary> => {
  const response = await api.patch(`/users/${id}/deactivate`);
  return response.data;
};

export const activateUser = async (id: string): Promise<OfficeAdminSummary> => {
  const response = await api.patch(`/users/${id}/activate`);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// Hook to get user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};

export const useOfficeAdmins = () => {
  return useQuery({
    queryKey: ["office-admins"],
    queryFn: getOfficeAdmins,
  });
};

export const useOfficeUsers = () => {
  return useQuery({
    queryKey: ["office-users"],
    queryFn: getOfficeUsers,
  });
};

export const useCreateOfficeAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOfficeAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-admins"] });
    },
  });
};

export const useCreateOfficeUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOfficeUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-users"] });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-admins"] });
      queryClient.invalidateQueries({ queryKey: ["office-users"] });
    },
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-admins"] });
      queryClient.invalidateQueries({ queryKey: ["office-users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-admins"] });
      queryClient.invalidateQueries({ queryKey: ["office-users"] });
    },
  });
};