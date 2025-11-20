import { offlineStorage } from './offlineStorage';

// Wrapper for API calls with offline support
export async function fetchWithOfflineSupport<T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string
): Promise<T> {
  try {
    // Try network request first
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache successful GET requests if cacheKey provided
    if (cacheKey && (!options || options.method === 'GET' || !options.method)) {
      offlineStorage.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.warn('[OfflineAPI] Network request failed, trying cache:', url);
    
    // If offline or request failed, try to return cached data
    if (cacheKey) {
      const cached = offlineStorage.get<T>(cacheKey);
      if (cached) {
        console.log('[OfflineAPI] Returning cached data for:', url);
        return cached;
      }
    }
    
    // No cache available, throw the error
    throw error;
  }
}

// Auto-caching API methods
export const offlineApi = {
  async getFlights() {
    return fetchWithOfflineSupport('/api/flights', {}, 'soe_flights');
  },

  async getStayins() {
    return fetchWithOfflineSupport('/api/stayins', {}, 'soe_stayins');
  },

  async getUser() {
    return fetchWithOfflineSupport('/api/auth/user', {}, 'soe_user');
  },

  async getRadrGroups() {
    return fetchWithOfflineSupport('/api/radr/groups', {}, 'soe_radr_groups');
  },

  // Mutations still require network
  async createFlight(data: any) {
    const response = await fetch('/api/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to create flight');
    
    // Invalidate cache after mutation
    offlineStorage.remove('soe_flights');
    
    return response.json();
  },

  async createStayin(data: any) {
    const response = await fetch('/api/stayins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to create stayin');
    
    // Invalidate cache after mutation
    offlineStorage.remove('soe_stayins');
    
    return response.json();
  },
};
