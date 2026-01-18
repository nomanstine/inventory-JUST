import api from "@/lib/api";
import { KEY } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role: string;
  permissions: string[];
  officeId?: string;
  officeName?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}


export const ENDPOINTS = {
    login: "/auth/login",
}


export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const { data } = await api.post<LoginResponse>(ENDPOINTS.login, {
      username: credentials.username,
      password: credentials.password,
    });

    // Validate response structure
    if (!data.token || !data.user) {
      throw new Error('Invalid response from server');
    }

    // Store token and user info in localStorage
    localStorage.setItem(KEY.auth_token, data.token);
    localStorage.setItem(KEY.user_info, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Login failed. Server Issue!');
  }
};

export const logout = () => {
    localStorage.removeItem(KEY.auth_token);
    localStorage.removeItem(KEY.user_info);
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = "/";
    }
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: login,
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async (): Promise<User | null> => {
      const token = localStorage.getItem(KEY.auth_token);
      if (!token) return null;

      try {
        // Assuming there's a profile endpoint, if not, we can get from localStorage
        const storedUser = localStorage.getItem(KEY.user_info);
        if (storedUser) {
          return JSON.parse(storedUser);
        }
        return null;
      } catch (error) {
        console.error('Failed to get user profile:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAuthStatus = () => {
  return useQuery({
    queryKey: ['authStatus'],
    queryFn: async (): Promise<boolean> => {
      const token = localStorage.getItem(KEY.auth_token);
      if (!token) return false;

      try {
        // You could add a token validation endpoint here
        // For now, just check if token exists
        return !!token;
      } catch (error) {
        console.error('Failed to check auth status:', error);
        return false;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};