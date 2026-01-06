import { useAuth } from '../context/AuthContext.jsx';
import { useCallback } from 'react';

function getBackendUrl() {
  const url = import.meta.env.VITE_API_BASE_URL || '/api';
  // Remove trailing /api if present to avoid double /api
  return url.endsWith('/api') ? url.slice(0, -4) : url;
}

export function useWatchHistory() {
  const { user, userProfile, authToken } = useAuth();

  const trackWatch = useCallback(async (watchData) => {
    if (!user || !authToken) {
      console.log('DEBUG: User not authenticated or token missing, skipping watch history', { user: !!user, authToken: !!authToken });
      return;
    }

    try {
      const backendUrl = getBackendUrl();
      // Ensure we have a username even if userProfile is not loaded yet
      const username = userProfile?.username || user.email.split('@')[0];
      
      const payload = {
        email: user.email,
        series_slug: watchData.series_slug || null,
        movie_slug: watchData.movie_slug || null,
        series_name: watchData.series_name || null,
        movie_name: watchData.movie_name || null,
        season_number: String(watchData.season_number || ''),
        episode_number: String(watchData.episode_number || ''),
        title: watchData.title || null,
        poster_image: watchData.poster_image || null,
        data: {
          username: username,
          type: watchData.type || (watchData.movie_slug ? 'movie' : 'series'),
          timestamp: new Date().toISOString(),
          ...watchData.extra_data
        }
      };

      console.log('DEBUG: Sending watch history payload:', payload);

      const response = await fetch(`${backendUrl}/api/watch-history`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to save watch history:', error);
      }
    } catch (err) {
      console.error('Error tracking watch:', err);
    }
  }, [user, userProfile, authToken]);

  const fetchWatchHistory = useCallback(async () => {
    if (!user || !authToken) {
      return [];
    }

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/watch-history/${user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error fetching watch history:', err);
      return [];
    }
  }, [user, authToken]);

  return { trackWatch, fetchWatchHistory };
}
