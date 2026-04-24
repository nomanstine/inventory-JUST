"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation, LoginCredentials } from "@/services/authService";
import { DemoCredentialsDropdown, DemoCredential } from "./DemoCredentialsDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LoginFormProps {
  onLoginSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({
  onLoginSuccess,
  redirectTo = "/offices"
}: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const { refreshUser } = useAuth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.username.trim() || !credentials.password.trim()) {
      toast.error("Username and password are required.");
      return;
    }

    try {
      const response = await loginMutation.mutateAsync(credentials);
      refreshUser(); // Refresh the auth context with new user data
      onLoginSuccess?.();
      const nextRoute = response.user.role === "SUPER_ADMIN" ? "/super-admin" : redirectTo;
      toast.success(`Welcome back, ${response.user.name || response.user.username}.`);
      router.push(nextRoute);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed. Please try again.");
    }
  }, [credentials, loginMutation, onLoginSuccess, redirectTo, router, refreshUser]);

  const handleDemoCredentialSelect = useCallback((demoCredential: DemoCredential) => {
    setCredentials(prev => ({
      ...prev,
      username: demoCredential.username,
      password: demoCredential.password,
    }));
  }, []);

  const handleInputChange = useCallback((
    field: keyof LoginCredentials,
    value: string | boolean
  ) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  }, []);

  const isFormValid = credentials.username.trim() && credentials.password.trim();
  const isLoading = loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DemoCredentialsDropdown
        onCredentialSelect={handleDemoCredentialSelect}
        disabled={isLoading}
      />

      <div className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={credentials.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            placeholder="Enter your username"
            disabled={isLoading}
            required
            autoComplete="username"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={credentials.rememberMe}
            onCheckedChange={(checked) => handleInputChange("rememberMe", !!checked)}
            disabled={isLoading}
          />
          <Label htmlFor="rememberMe" className="text-sm">
            Remember me
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}