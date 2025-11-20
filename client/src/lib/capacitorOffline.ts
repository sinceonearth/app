import { queryClient, getAuthToken } from "./queryClient";
import { isCapacitor } from "./pwaDetection";

/**
 * Capacitor Offline Bootstrap
 * Hydrates React Query cache from localStorage before app starts
 * This prevents black screen when opening app offline
 */
export function bootstrapCapacitorOffline(): void {
  if (!isCapacitor()) {
    return; // Only run in Capacitor
  }

  console.log('[Capacitor] Bootstrapping offline data...');

  const token = getAuthToken();
  
  if (token) {
    // Hydrate user data from localStorage into React Query cache
    const cachedUser = localStorage.getItem('cached_user');
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        queryClient.setQueryData(['/api/auth/user'], user);
        console.log('[Capacitor] ✅ Hydrated user from cache:', user.email);
      } catch (err) {
        console.warn('[Capacitor] Failed to parse cached user:', err);
      }
    }

    // Hydrate flights from localStorage
    const cachedFlights = localStorage.getItem('cached_flights');
    if (cachedFlights) {
      try {
        const flights = JSON.parse(cachedFlights);
        queryClient.setQueryData(['/api/flights'], flights);
        console.log('[Capacitor] ✅ Hydrated flights from cache');
      } catch (err) {
        console.warn('[Capacitor] Failed to parse cached flights:', err);
      }
    }

    // Hydrate stayins from localStorage
    const cachedStayins = localStorage.getItem('cached_stayins');
    if (cachedStayins) {
      try {
        const stayins = JSON.parse(cachedStayins);
        queryClient.setQueryData(['/api/stayins'], stayins);
        console.log('[Capacitor] ✅ Hydrated stayins from cache');
      } catch (err) {
        console.warn('[Capacitor] Failed to parse cached stayins:', err);
      }
    }

    // Hydrate radr groups from localStorage
    const cachedRadrGroups = localStorage.getItem('cached_radr_groups');
    if (cachedRadrGroups) {
      try {
        const groups = JSON.parse(cachedRadrGroups);
        queryClient.setQueryData(['/api/radr/groups'], groups);
        console.log('[Capacitor] ✅ Hydrated radr groups from cache');
      } catch (err) {
        console.warn('[Capacitor] Failed to parse cached radr groups:', err);
      }
    }
  }
}
