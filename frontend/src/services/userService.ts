import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  fullName?: string;
  role: string | { id: string; name: string; description: string };
  permissions: string[];
  office: {
    id: string;
    name: string;
  };
}

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Hook to get user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};