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
                  className="flex gap-3 sm:gap-4 p-2 sm:p-4 rounded-xl border border-white/5 hover:bg-white/5 transition group cursor-pointer"
                >
                  {/* Poster - YouTube Style (Landscape) */}
                  {(item.poster_image) && (
                    <div className="flex-shrink-0 relative">
                      <img
                        src={typeof item.poster_image === 'object' ? item.poster_image?.value : item.poster_image}
                        alt={titleText}
                        className="w-32 sm:w-40 md:w-52 aspect-video rounded-lg object-cover shadow-sm group-hover:brightness-75 transition-all duration-300"
                      />
                      {epNum && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded text-white font-medium">
                          Ep {epNum}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content - YouTube Style */}
                  <div className="flex-1 min-w-0 flex flex-col py-0.5">
                    <h3 className="text-sm sm:text-base font-medium text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {titleText || sName || mName}
                    </h3>
                    
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-[11px] sm:text-xs text-muted/80">
                        {sName && sName !== titleText ? sName : 'Anime Series'}
                        {seaNum && ` • Season ${seaNum}`}
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted/60">
                        Watched {new Date(item.watched_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action - More discreet for YT style */}
                  <div className="flex-shrink-0 self-start mt-1">
                    <div className="p-1 rounded-full hover:bg-white/10 text-muted/40">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM10.5 12c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5zm0-4.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5z"></path></svg>
                    </div>
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
