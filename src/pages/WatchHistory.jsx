import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWatchHistory } from '../hooks/useWatchHistory.js';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function getBackendUrl() {
  const url = import.meta.env.VITE_API_BASE_URL || '/api';
  // Remove trailing /api if present to avoid double /api
  return url.endsWith('/api') ? url.slice(0, -4) : url;
}

function WatchHistory() {
  const { user, authToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !authToken) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/watch-history/${user.email}`, {
          headers: { 
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHistory(data.data || []);
        } else {
          console.error('Failed to fetch watch history');
          setHistory([]);
        }
      } catch (err) {
        console.error('Error loading watch history:', err);
        setHistory([]);
      }
      setLoading(false);
    };

    loadHistory();
  }, [user, authToken]);

  if (!user) {
    return (
      <section className="py-20 text-center">
        <h1 className="text-3xl font-semibold text-white">Please log in</h1>
        <p className="mt-4 text-muted">You need to be logged in to view your watch history.</p>
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
        >
          Sign In
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-card/50 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (history.length === 0) {
    return (
      <section className="py-20 text-center">
        <h1 className="text-3xl font-semibold text-white">No watch history</h1>
        <p className="mt-4 text-muted">Start watching anime and movies to see them here!</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
        >
          Browse Content
        </Link>
      </section>
    );
  }

  // Group by date
  const groupByDate = (items) => {
    const groups = {};
    items.forEach(item => {
      const date = new Date(item.watched_at);
      const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(item);
    });
    return groups;
  };

  const groupedHistory = groupByDate(history);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition mb-4">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-white">Watch History</h1>
      </div>

      {Object.entries(groupedHistory).map(([date, items]) => (
        <div key={date} className="mb-8">
          <h2 className="text-lg font-semibold text-muted uppercase tracking-wide mb-4">{date}</h2>
          <div className="space-y-4">
            {items.map((item) => {
              const sSlug = typeof item.series_slug === 'object' ? item.series_slug?.value : item.series_slug;
              const mSlug = typeof item.movie_slug === 'object' ? item.movie_slug?.value : item.movie_slug;
              const epNum = typeof item.episode_number === 'object' ? item.episode_number?.value : item.episode_number;
              const seaNum = typeof item.season_number === 'object' ? item.season_number?.value : item.season_number;
              const sName = typeof item.series_name === 'object' ? item.series_name?.value : item.series_name;
              const mName = typeof item.movie_name === 'object' ? item.movie_name?.value : item.movie_name;
              const titleText = typeof item.title === 'object' ? item.title?.value : item.title;

              const watchLink = sSlug 
                ? `/series/${sSlug}/episode/${seaNum || 1}-${epNum || 1}`
                : mSlug 
                ? `/movie/${mSlug}`
                : '#';

              return (
                <Link
                  key={item.id}
                  to={watchLink}
                  className="flex gap-4 p-4 rounded-xl border border-white/10 bg-card/40 hover:bg-card/60 transition group cursor-pointer"
                >
                  {/* Poster */}
                  {(item.poster_image) && (
                    <div className="flex-shrink-0">
                      <img
                        src={typeof item.poster_image === 'object' ? item.poster_image?.value : item.poster_image}
                        alt={titleText}
                        className="w-40 sm:w-48 aspect-video rounded-lg object-cover shadow-md group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate group-hover:text-primary transition-colors">
                      {titleText || sName || mName}
                    </h3>
                    
                    {epNum && (
                      <p className="text-sm text-muted mt-1">
                        Episode {epNum}
                        {seaNum && ` • Season ${seaNum}`}
                      </p>
                    )}

                    <p className="text-xs text-muted/70 mt-2">
                      {new Date(item.watched_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 flex items-center">
                    <span className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition">
                      {item.series_slug ? 'Continue' : 'Watch'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

export default WatchHistory;
