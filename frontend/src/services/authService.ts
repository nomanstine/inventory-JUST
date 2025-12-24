import api from "@/lib/api";
import { KEY } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";


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
      window.location.href = "/login";
    }
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: login,
  });
};