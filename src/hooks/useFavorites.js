import { useState, useCallback } from 'react';

const getBackendUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL || '/api';
  // Remove trailing /api if present to avoid double /api
  return url.endsWith('/api') ? url.slice(0, -4) : url;
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async (email, authToken) => {
    if (!email || !authToken) return [];
    
    setLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/favorites/${email}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.data || []);
        return data.data || [];
      } else {
        const errorData = await response.json();
        console.error('Error fetching favorites:', errorData);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
    return [];
  }, []);

  const addFavorite = useCallback(async (email, authToken, favoriteData) => {
    if (!email || !authToken) return false;
    
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          email,
          ...favoriteData
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Refresh favorites list
        await fetchFavorites(email, authToken);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Error adding favorite:', errorData);
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
    return false;
  }, [fetchFavorites]);

  const removeFavorite = useCallback(async (email, authToken, slug) => {
    if (!email || !authToken || !slug) return false;
    
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/favorites/${email}/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        // Refresh favorites list
        await fetchFavorites(email, authToken);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Error removing favorite:', errorData);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
    return false;
  }, [fetchFavorites]);

  const isFavorited = useCallback((slug) => {
    return favorites.some(fav => fav.series_slug === slug || fav.movie_slug === slug);
  }, [favorites]);

  return {
    favorites,
    loading,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorited
  };
};
