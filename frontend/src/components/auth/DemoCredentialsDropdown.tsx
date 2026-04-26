"use client";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DemoCredential {
  label: string;
  username: string;
  password: string;
  role?: string;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    label: "Super Admin",
    username: "super.admin",
    password: "password123",
    role: "SUPER_ADMIN",
  },
  {
    label: "FET Admin",
    username: "admin.fet",
    password: "password123",
    role: "ADMIN",
  },
  {
    label: "FET User",
    username: "user.fet",
    password: "password123",
    role: "USER",
  },
  {
    label: "CSE Admin",
    username: "admin.cse",
    password: "password123",
    role: "ADMIN",
  },
  {
    label: "CSE User",
    username: "user.cse",
    password: "password123",
    role: "USER",
  },
];

interface DemoCredentialsDropdownProps {
  onCredentialSelect: (credential: DemoCredential) => void;
  disabled?: boolean;
}

export function DemoCredentialsDropdown({
  onCredentialSelect,
  disabled = false
}: DemoCredentialsDropdownProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleValueChange = (username: string) => {
    const credential = DEMO_CREDENTIALS.find(c => c.username === username);
    if (credential) {
      onCredentialSelect(credential);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Demo Credentials (Development Only)
      </label>
      <Select onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select demo credentials to auto-fill" />
        </SelectTrigger>
        <SelectContent>
          {DEMO_CREDENTIALS.map((cred) => (
            <SelectItem key={cred.username} value={cred.username}>
              <div className="flex flex-col">
                <span className="font-medium">{cred.label}</span>
                <span className="text-xs text-gray-500">Role: {cred.role}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">
        Select a demo credential to automatically fill the login form
      </p>
    </div>
  );
}