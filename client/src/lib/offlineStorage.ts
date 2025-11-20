// Offline storage utility for caching data locally

const STORAGE_KEYS = {
  FLIGHTS: 'soe_flights',
  STAYINS: 'soe_stayins',
  USER: 'soe_user',
  COUNTRIES: 'soe_countries',
  RADR_GROUPS: 'soe_radr_groups',
  LAST_SYNC: 'soe_last_sync',
} as const;

export const offlineStorage = {
  // Generic get/set with type safety
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error reading', key, error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.updateLastSync();
    } catch (error) {
      console.error('[OfflineStorage] Error writing', key, error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[OfflineStorage] Error removing', key, error);
    }
  },

  // Specific data handlers
  saveFlights(flights: any[]): void {
    this.set(STORAGE_KEYS.FLIGHTS, flights);
  },

  getFlights(): any[] {
    return this.get(STORAGE_KEYS.FLIGHTS) || [];
  },

  saveStayins(stayins: any[]): void {
    this.set(STORAGE_KEYS.STAYINS, stayins);
  },

  getStayins(): any[] {
    return this.get(STORAGE_KEYS.STAYINS) || [];
  },

  saveUser(user: any): void {
    this.set(STORAGE_KEYS.USER, user);
  },

  getUser(): any {
    return this.get(STORAGE_KEYS.USER);
  },

  saveCountries(countries: any[]): void {
    this.set(STORAGE_KEYS.COUNTRIES, countries);
  },

  getCountries(): any[] {
    return this.get(STORAGE_KEYS.COUNTRIES) || [];
  },

  saveRadrGroups(groups: any[]): void {
    this.set(STORAGE_KEYS.RADR_GROUPS, groups);
  },

  getRadrGroups(): any[] {
    return this.get(STORAGE_KEYS.RADR_GROUPS) || [];
  },

  updateLastSync(): void {
    this.set(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  },

  getLastSync(): string | null {
    return this.get(STORAGE_KEYS.LAST_SYNC);
  },

  // Clear all offline data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.remove(key);
    });
  },

  // Get storage size info
  getStorageInfo(): { used: number; total: number; percentage: number } {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    const total = 5 * 1024 * 1024; // ~5MB typical localStorage limit
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  },
};
