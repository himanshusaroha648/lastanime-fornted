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
    if (!user || !userProfile || !authToken) {
      console.log('User not authenticated or token missing, skipping watch history');
      return;
    }

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/watch-history`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          email: user.email,
          username: userProfile.username,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          ...watchData
        }),
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
