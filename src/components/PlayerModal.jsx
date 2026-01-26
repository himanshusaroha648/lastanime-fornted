import { useEffect, useMemo, useState, useRef } from 'react';
import { X, SkipBack, SkipForward } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWatchHistory } from '../hooks/useWatchHistory.js';

function formatServerLabel(server, index) {
        try {
                const videoUrl = server.url || server.real_video;
                if (!videoUrl) return `Server ${server.option ?? index + 1}`;
                const url = new URL(videoUrl);
                return `Server ${server.option ?? index + 1} • ${url.hostname}`;
        } catch {
                return `Server ${server.option ?? index + 1}`;
        }
}

function PlayerModal({ open, onClose, episode, onPrev, onNext, seriesTitle, episodeInfo = {}, seriesPoster = null, moviePoster = null }) {
        const [activeSource, setActiveSource] = useState('');
        const { user, userProfile } = useAuth();
        const { trackWatch } = useWatchHistory();
        const lastWatchedRef = useRef(null);

        const sources = useMemo(() => {
                if (Array.isArray(episode?.servers) && episode.servers.length > 0) {
                        return episode.servers.filter((server) => Boolean(server.url || server.real_video));
                }
                return [];
        }, [episode]);

        useEffect(() => {
                if (!open) return undefined;

                const handleKey = (event) => {
                        if (event.code === 'Escape') {
                                onClose();
                        }
                };

                window.addEventListener('keydown', handleKey);
                return () => window.removeEventListener('keydown', handleKey);
        }, [open, onClose]);

        useEffect(() => {
                if (!open) {
                        setActiveSource(''); 
                        return;
                }
                
                // Server Priority Logic
                const priorityDomains = [
                    'as-cdn21.top',
                    'rubystm.com',
                    'vidmoly.net',
                    'short.icu'
                ];

                let selectedSource = '';
                
                // Try to find servers based on priority domains
                for (const domain of priorityDomains) {
                    const found = sources.find(s => {
                        const url = s.url || s.real_video || '';
                        return url.includes(domain);
                    });
                    if (found) {
                        selectedSource = found.url || found.real_video;
                        break;
                    }
                }

                // Fallback to first available source if no priority match found
                if (!selectedSource && sources.length > 0) {
                    const first = sources[0];
                    selectedSource = first.url || first.real_video;
                }

                const defaultSource = selectedSource || '';
                
                // Reset source briefly to ensure iframe reloads cleanly
                setActiveSource('');
                
                const timer = setTimeout(() => {
                    if (defaultSource) {
                        setActiveSource(defaultSource);
                    }
                }, 300);

                // Track watch only once per unique episode/movie when player opens or episode changes
                if (episode && user && userProfile) {
                    const seriesSlug = episodeInfo.seriesSlug || (episodeInfo.movieSlug ? null : 'unknown');
                    const movieSlug = episodeInfo.movieSlug || null;
                    const season = String(episodeInfo.seasonNumber || '');
                    const epNum = String(episodeInfo.episodeNumber || '');
                    const epTitle = seriesTitle || episodeInfo.episodeTitle || episode.title || `Episode ${epNum}`;
                    // Requirement: Title should be the Series Name
                    const watchTitle = seriesTitle || epTitle;
                    const poster = episodeInfo.episodeThumbnail || episode.thumbnail || seriesPoster || moviePoster || null;
                    
                    const currentKey = movieSlug ? `movie-${movieSlug}` : `series-${seriesSlug}-s${season}-e${epNum}`;
                    
                    if (lastWatchedRef.current !== currentKey) {
                        lastWatchedRef.current = currentKey;
                        console.log('DEBUG: Triggering watch history API call for:', currentKey, 'Title:', watchTitle, 'Poster:', poster);
                        
                        // Use fresh metadata from episode/episodeInfo to ensure correct sync
                        trackWatch({
                            series_name: seriesTitle || null,
                            series_slug: seriesSlug,
                            movie_name: episodeInfo.movieTitle || null,
                            movie_slug: movieSlug,
                            episode_number: epNum,
                            season_number: season,
                            poster_image: poster,
                            title: watchTitle,
                            type: movieSlug ? 'movie' : 'series'
                        });
                    }
                }
                return () => clearTimeout(timer);
        }, [open, user, userProfile, episode, episodeInfo, seriesTitle, seriesPoster, moviePoster, trackWatch, sources]);

        if (!open || !episode) return null;

        return (
                <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-10"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Episode player"
                >
                        <div className="glass-surface relative w-full max-w-5xl rounded-3xl border border-white/10 p-6 shadow-floating">
                                <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Close player"
                                        className="absolute -right-2 -top-2 md:-right-3 md:-top-3 z-[60] rounded-full border border-white/20 bg-primary p-2.5 md:p-3 text-white shadow-xl transition hover:scale-110 hover:bg-primary/90 active:scale-95"
                                >
                                        <X size={20} className="md:hidden" strokeWidth={2.5} />
                                        <X size={24} className="hidden md:block" strokeWidth={2.5} />
                                </button>

                                <div className="aspect-video overflow-hidden rounded-2xl bg-black relative">
                                        {activeSource ? (
                                                <iframe
                                                        key={activeSource}
                                                        src={activeSource}
                                                        title="Video player"
                                                        allowFullScreen
                                                        className="h-full w-full border-0 relative z-10"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        referrerPolicy="no-referrer"
                                                />
                                        ) : (
                                                <div className="flex h-full items-center justify-center text-muted">
                                                        <p>No video source available</p>
                                                </div>
                                        )}
                                        {/* Loading overlay - hidden when activeSource is present, but kept for z-index safety */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
                                            <div className="text-muted">Loading Player...</div>
                                        </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <button
                                                type="button"
                                                aria-label="Previous episode"
                                                onClick={onPrev || undefined}
                                                disabled={!onPrev}
                                                className={`flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold transition ${
                                                        onPrev ? 'bg-primary text-white hover:bg-primary/90' : 'bg-card/40 text-muted opacity-60 cursor-not-allowed'
                                                }`}
                                        >
                                                <SkipBack size={18} />
                                                Previous
                                        </button>
                                        <button
                                                type="button"
                                                aria-label="Next episode"
                                                onClick={onNext || undefined}
                                                disabled={!onNext}
                                                className={`flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold transition ${
                                                        onNext ? 'bg-primary text-white hover:bg-primary/90' : 'bg-card/40 text-muted opacity-60 cursor-not-allowed'
                                                }`}
                                        >
                                                Next
                                                <SkipForward size={18} />
                                        </button>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                                        {sources.length > 0 ? (
                                                <label className="flex items-center gap-2">
                                                        <span className="font-semibold text-white">Servers</span>
                                                        <select
                                                                className="rounded-full border border-white/10 bg-card px-3 py-2 text-xs text-muted focus:outline-none"
                                                                value={activeSource}
                                                                onChange={(event) => {
                                                                        const newSource = event.target.value;
                                                                        if (newSource !== activeSource) {
                                                                            setActiveSource(newSource);
                                                                        }
                                                                }}
                                                        >
                                                                {sources.map((server, index) => (
                                                                        <option key={server.url || server.real_video} value={server.url || server.real_video}>
                                                                                {formatServerLabel(server, index)}
                                                                        </option>
                                                                ))}
                                                        </select>
                                                </label>
                                        ) : (
                                                <p className="rounded-full border border-white/10 bg-card px-3 py-2 text-xs text-muted">
                                                        No streaming servers registered for this episode.
                                                </p>
                                        )}
                                </div>

                                <div className="mt-6 space-y-2 text-sm text-muted">
                                        <p>
                                                <strong className="text-white">{episode?.title}</strong>
                                                {seriesTitle && ` · ${seriesTitle}`}
                                        </p>
                                        <p className="text-xs text-muted/80">
                                                If video doesn't play, please change the server from the dropdown above.
                                        </p>
                                </div>
                        </div>
                </div>
        );
}

export default PlayerModal;
