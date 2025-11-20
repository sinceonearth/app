import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  getQueryFn,
  clearAuthToken,
  queryClient,
  getAuthToken,
} from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const [, navigate] = useLocation();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    retry: false,
  });

  const token = getAuthToken();

  const logout = () => {
    clearAuthToken();
    queryClient.setQueryData(["/api/auth/user"], null);
    navigate("/");
  };

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };
}
