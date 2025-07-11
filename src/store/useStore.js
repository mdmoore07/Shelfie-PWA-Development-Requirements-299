import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Settings state
      settings: {
        theme: 'light',
        notifications: true,
        autoSave: true,
        darkMode: false,
        openaiApiKey: '',
        aiSettings: {
          listingStyle: 'casual', // 'casual', 'professional', or 'custom'
          customPrompt: '',
          removeEmojis: false
        }
      },

      // Listings state
      listings: [],
      currentListing: null,

      // UI state
      isLoading: false,
      error: null,

      // Actions
      updateSettings: (newSettings) => set((state) => ({
        settings: {
          ...state.settings,
          ...newSettings
        }
      })),

      // Other actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Listing actions
      setListings: (listings) => set({ listings }),
      addListing: (listing) => set((state) => ({
        listings: [...state.listings, {
          ...listing,
          id: listing.id || Date.now().toString(),
          type: listing.type || 'general'
        }]
      })),
      updateListing: (id, updates) => set((state) => ({
        listings: state.listings.map(listing =>
          listing.id === id ? { ...listing, ...updates } : listing
        )
      })),
      deleteListing: (id) => set((state) => ({
        listings: state.listings.filter(listing => listing.id !== id)
      })),
      setCurrentListing: (listing) => set({ currentListing: listing }),
      clearCurrentListing: () => set({ currentListing: null }),

      // Stats getter
      getStats: () => {
        const state = get();
        return {
          totalListings: state.listings.length,
          draftListings: state.listings.filter(l => l.status === 'draft').length,
          postedListings: state.listings.filter(l => l.status === 'posted').length,
          soldListings: state.listings.filter(l => l.status === 'sold').length,
        };
      },

      // User state
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'shelfie-storage',
      partialize: (state) => ({
        listings: state.listings,
        settings: state.settings,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useStore;