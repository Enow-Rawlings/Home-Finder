// hooks/useDashboardData.js
//
// Expected backend contract:
//
// GET /dashboard/summary
// {
//   user: { name, role, avatarUrl, preferredLocation },
//   stats: { savedListings, recentlyViewed, newMessages, pendingPayments },
//   newListingsCount: number,
//   recentSearches: [{ id, label }],
//   recommendedListings: [{
//     id, title, price, currency, period, location,
//     beds, baths, area, image, verified, isNew, isSaved
//   }]
// }
//
// DELETE /dashboard/recent-searches/:id
// POST   /listings/:id/save
// DELETE /listings/:id/save

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

const INITIAL_STATE = {
  user: null,
  stats: {
    savedListings: 0,
    recentlyViewed: 0,
    newMessages: 0,
    pendingPayments: 0,
  },
  newListingsCount: 0,
  recentSearches: [],
  recommendedListings: [],
};

export function useDashboardData() {
  const [data, setData] = useState(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/dashboard/summary');
      setData({
        user: res.user ?? null,
        stats: { ...INITIAL_STATE.stats, ...res.stats },
        newListingsCount: res.newListingsCount ?? 0,
        recentSearches: res.recentSearches ?? [],
        recommendedListings: res.recommendedListings ?? [],
      });
    } catch (err) {
      setError(err.message || 'Something went wrong while loading your dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Optimistic remove, rolls back on failure
  const removeRecentSearch = useCallback(async (searchId) => {
    let previous;
    setData((prev) => {
      previous = prev.recentSearches;
      return { ...prev, recentSearches: prev.recentSearches.filter((s) => s.id !== searchId) };
    });
    try {
      await apiClient.delete(`/dashboard/recent-searches/${searchId}`);
    } catch {
      setData((prev) => ({ ...prev, recentSearches: previous }));
    }
  }, []);

  // Optimistic save/unsave toggle, rolls back on failure
  const toggleSaveListing = useCallback(async (listingId, isSaved) => {
    setData((prev) => ({
      ...prev,
      recommendedListings: prev.recommendedListings.map((l) =>
        l.id === listingId ? { ...l, isSaved: !isSaved } : l
      ),
      stats: { ...prev.stats, savedListings: prev.stats.savedListings + (isSaved ? -1 : 1) },
    }));
    try {
      if (isSaved) {
        await apiClient.delete(`/listings/${listingId}/save`);
      } else {
        await apiClient.post(`/listings/${listingId}/save`);
      }
    } catch {
      setData((prev) => ({
        ...prev,
        recommendedListings: prev.recommendedListings.map((l) =>
          l.id === listingId ? { ...l, isSaved } : l
        ),
        stats: { ...prev.stats, savedListings: prev.stats.savedListings + (isSaved ? 1 : -1) },
      }));
    }
  }, []);

  return { data, isLoading, error, refetch: fetchDashboard, removeRecentSearch, toggleSaveListing };
}