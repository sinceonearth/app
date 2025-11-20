import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Flight } from "@shared/schema";

export function useFlights() {
  const { token } = useAuth();

  const query = useQuery<Flight[]>({
    queryKey: ["flights"],
    enabled: !!token, // ✅ only run if logged in
    staleTime: 1000 * 60 * 5, // cache for 5 mins
    retry: 1, // only retry once if it fails
    queryFn: async () => {
      if (!token) throw new Error("No auth token found");

      const res = await apiRequest("GET", "/api/flights", null, token);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch flights: ${text || res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid flights data");

      return data as Flight[];
    },
  });

  return {
    flights: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
