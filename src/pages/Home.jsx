import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Flame, Sparkles, ChevronLeft, ChevronRight, History, Heart } from 'lucide-react';
import SeriesCard from '../components/SeriesCard.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import { fetchLibrary, fetchLatestEpisodes } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useWatchHistory } from '../hooks/useWatchHistory.js';
import { useFavorites } from '../hooks/useFavorites.js';

const ITEMS_PER_PAGE = 15;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function Home() {
        const navigate = useNavigate();
        const location = useLocation();
        const { user, authToken } = useAuth();
        const { fetchWatchHistory } = useWatchHistory();
        const { fetchFavorites } = useFavorites();
        const [series, setSeries] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [query, setQuery] = useState('');
        const [typeFilter, setTypeFilter] = useState('All');
        const [genreFilter, setGenreFilter] = useState('All');
        const [sortOrder, setSortOrder] = useState('updated');
        const [letterFilter, setLetterFilter] = useState('All');
        const [currentPage, setCurrentPage] = useState(1);
        const [latestEpisodes, setLatestEpisodes] = useState([]);
        const [watchHistory, setWatchHistory] = useState([]);
        const [favorites, setFavorites] = useState([]);
        const [loadingHistory, setLoadingHistory] = useState(false);
        const [randomSeries, setRandomSeries] = useState([]);
        const [randomMovies, setRandomMovies] = useState([]);
        const [randomMixed, setRandomMixed] = useState([]);

        // Shuffle helper function
        const shuffleArray = (arr) => {
                const newArr = [...arr];
                for (let i = newArr.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                }
                return newArr;
        };

        useEffect(() => {
                setLoading(true);
                Promise.all([fetchLibrary(), fetchLatestEpisodes()])
                        .then(([libraryList, episodesList]) => {
                                setSeries(libraryList);
                                setLatestEpisodes(episodesList);
                                setError(null);
                                
                                // Generate random content on first load
                                const seriesOnly = libraryList.filter(item => item.type !== 'movie');
                                const moviesOnly = libraryList.filter(item => item.type === 'movie');
                                
                                setRandomSeries(shuffleArray(seriesOnly).slice(0, 12));
                                setRandomMovies(shuffleArray(moviesOnly).slice(0, 10));
                                setRandomMixed(shuffleArray(libraryList).slice(0, 10));
                        })
                        .catch((err) => {
                                setSeries([]);
                                setError(err.message || 'Failed to load library');
                        })
                        .finally(() => setLoading(false));
        }, []);

        // Refresh random content every 15 minutes
        useEffect(() => {
                const interval = setInterval(() => {
                        const seriesOnly = series.filter(item => item.type !== 'movie');
                        const moviesOnly = series.filter(item => item.type === 'movie');
                        
                        setRandomSeries(shuffleArray(seriesOnly).slice(0, 12));
                        setRandomMovies(shuffleArray(moviesOnly).slice(0, 10));
                        setRandomMixed(shuffleArray(series).slice(0, 10));
                }, 15 * 60 * 1000); // 15 minutes
                
                return () => clearInterval(interval);
        }, [series]);

        // Fetch watch history and favorites when user logs in
        useEffect(() => {
                if (user && authToken) {
                        setLoadingHistory(true);
                        Promise.all([
                                fetchWatchHistory(),
                                fetchFavorites(user.email, authToken)
                        ])
                                .then(([history, favs]) => {
                                        setWatchHistory(history || []);
                                        setFavorites(favs || []);
                                })
                                .catch((err) => {
                                        console.error('Error loading user data:', err);
                                        setWatchHistory([]);
                                        setFavorites([]);
                                })
                                .finally(() => setLoadingHistory(false));
                } else {
                        setWatchHistory([]);
                        setFavorites([]);
                }
        }, [user, authToken, fetchWatchHistory, fetchFavorites]);

        useEffect(() => {
                const handleHeaderSearch = (event) => {
                        setQuery(event.detail.query);
                        setTypeFilter(event.detail.type);
                };
                window.addEventListener('header-search', handleHeaderSearch);
                return () => window.removeEventListener('header-search', handleHeaderSearch);
        }, []);

        useEffect(() => {
                if (location.state?.searchQuery !== undefined) {
                        setQuery(location.state.searchQuery);
                        setTypeFilter(location.state.searchType || 'All');
                }
        }, [location.state]);

        const allGenres = useMemo(() => {
                const set = new Set();
                series.forEach((item) => {
                        const genres = Array.isArray(item.genres) 
                                ? item.genres 
                                : typeof item.genres === 'string' 
                                        ? item.genres.split(',').map(g => g.trim()).filter(Boolean)
                                        : [];
                        genres.forEach((genre) => set.add(genre));
                });
                return ['All', ...Array.from(set)];
        }, [series]);

        const latestEpisodeDates = useMemo(() => {
                const dateMap = new Map();
                // Process ALL latestEpisodes for date mapping to ensure visual accuracy
                latestEpisodes.forEach((ep) => {
                        const slug = ep.seriesSlug;
                        const date = new Date(ep.addedAt || ep.createdAt || ep.updatedAt || 0);
                        if (!dateMap.has(slug) || date > dateMap.get(slug)) {
                                dateMap.set(slug, date);
                        }
                });
                return dateMap;
        }, [latestEpisodes]);

        const filteredSeries = useMemo(() => {
                let results = [...series];
                
                // Sort by update time (updated_at or created_at) - newest first
                results.sort((a, b) => {
                        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                        return dateB - dateA;
                });
                
                if (typeFilter !== 'All') {
                        results = results.filter((item) => {
                                if (typeFilter === 'Movies') return item.type === 'movie';
                                if (typeFilter === 'Anime') return item.type !== 'movie';
                                return true;
                        });
                }
                if (genreFilter !== 'All') {
                        results = results.filter((item) => {
                                const genres = Array.isArray(item.genres) 
                                        ? item.genres 
                                        : typeof item.genres === 'string' 
                                                ? item.genres.split(',').map(g => g.trim()).filter(Boolean)
                                                : [];
                                return genres.includes(genreFilter);
                        });
                }
                if (query.trim()) {
                        const q = query.toLowerCase();
                        results = results.filter((item) => item.title.toLowerCase().includes(q));
                }
                if (letterFilter !== 'All') {
                        results = results.filter((item) => 
                                item.title.charAt(0).toUpperCase() === letterFilter
                        );
                }
                return results;
        }, [genreFilter, query, series, letterFilter, typeFilter, latestEpisodes]);

        const totalPages = Math.ceil(filteredSeries.length / ITEMS_PER_PAGE);
        const paginatedSeries = useMemo(() => {
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                return filteredSeries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        }, [filteredSeries, currentPage]);

        useEffect(() => {
                setCurrentPage(1);
        }, [query, genreFilter, letterFilter, sortOrder, typeFilter]);

        useEffect(() => {
                if (query.trim()) {
                        document.title = `Search: ${query} · LASTANIME`;
                } else {
                        document.title = 'LASTANIME · Watch Anime Online';
                }
        }, [query]);

        const trending = useMemo(
                () => filteredSeries.slice(0, 4),
                [filteredSeries]
        );

        const handlePageChange = (newPage) => {
                setCurrentPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const handleEpisodeClick = (ep) => {
                const seriesSlug = ep.seriesSlug || (ep.series ? ep.series.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');
                if (!seriesSlug) {
                        console.error('Cannot navigate: series slug is missing', ep);
                        return;
                }
                const episodeId = `${ep.season}-${ep.episode}`;
                const targetPath = `/series/${seriesSlug}/episode/${episodeId}`;
                
                // Use window.location.pathname check if user is truly available or loading
                if (!user && !authToken) {
                        navigate(`/auth?redirect=${encodeURIComponent(targetPath)}`);
                        return;
                }
                
                navigate(targetPath);
        };

        return (
                <section className="home-background space-y-16 pb-8">
                        {!loading && series.length > 0 && !query.trim() && (
                                <div className="max-w-[1000px] mx-auto pt-8">
                                        <HeroCarousel series={series} />
                                </div>
                        )}

                        {/* Favorites Section - Show only when logged in and have favorites */}
                        {user && favorites.length > 0 && !query.trim() && (
                                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4">
                                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                <Heart size={24} className="text-primary" />
                                                Your Favorites
                                        </h2>
                                        <div className="episode-scroll-container">
                                                <div className="episode-scroll">
                                                        {favorites.slice(0, 20).map((item) => (
                                                                <div
                                                                        key={item.added_at || item.title}
                                                                        className="episode-card-horizontal cursor-pointer"
                                                                        onClick={() => {
                                                                                if (item.series_slug) {
                                                                                        navigate(`/series/${item.series_slug}`);
                                                                                } else if (item.movie_slug) {
                                                                                        navigate(`/movie/${item.movie_slug}`);
                                                                                }
                                                                        }}
                                                                >
                                                                        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                                                                                {item.poster_image ? (
                                                                                        <img
                                                                                                src={typeof item.poster_image === 'object' ? item.poster_image?.value : item.poster_image}
                                                                                                alt={typeof item.title === 'object' ? item.title?.value : item.title}
                                                                                                className="w-full h-full object-cover object-center"
                                                                                                loading="lazy"
                                                                                                style={{ imageRendering: 'high-quality' }}
                                                                                        />
                                                                                ) : (
                                                                                        <div className="w-full h-full bg-card/60 flex items-center justify-center">
                                                                                                <Heart size={32} className="text-muted" />
                                                                                        </div>
                                                                                )}
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
                                                                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                                                                        <p className="text-[10px] sm:text-xs font-medium text-white truncate leading-tight">
                                                                                                {typeof item.series_name === 'object' ? item.series_name?.value : (typeof item.movie_name === 'object' ? item.movie_name?.value : (item.series_name || item.movie_name || (typeof item.title === 'object' ? item.title?.value : item.title)))}
                                                                                        </p>
                                                                                        {item.rating && (
                                                                                                <p className="text-[9px] text-primary mt-0.5">
                                                                                                        ⭐ {item.rating.toFixed(1)}
                                                                                                </p>
                                                                                        )}
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                        )}

                        {/* Watched History Section - Show only when logged in and have history */}
                        {user && watchHistory.length > 0 && !query.trim() && (
                                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4">
                                        <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                        <History size={24} className="text-primary" />
                                                        Your Watch History
                                                </h2>
                                                <button 
                                                        onClick={() => navigate('/watch-history')}
                                                        className="text-base font-bold text-primary hover:text-primary/80 transition-all hover:scale-105 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                                                >
                                                        View All
                                                        <ChevronRight size={18} />
                                                </button>
                                        </div>
                                        <div className="episode-scroll-container">
                                                <div className="episode-scroll">
                                                        {watchHistory.slice(0, 9).map((item) => (
                                                                <div
                                                                        key={item.id}
                                                                        className="episode-card-horizontal cursor-pointer"
                                                                        onClick={() => {
                                                                                const sSlug = typeof item.series_slug === 'object' ? item.series_slug?.value : item.series_slug;
                                                                                if (sSlug) {
                                                                                        const epNum = typeof item.episode_number === 'object' ? item.episode_number?.value : item.episode_number;
                                                                                        const seaNum = typeof item.season_number === 'object' ? item.season_number?.value : item.season_number;
                                                                                        const episodeId = `${seaNum || 1}-${epNum || 1}`;
                                                                                        navigate(`/series/${sSlug}/episode/${episodeId}`);
                                                                                }
                                                                        }}
                                                                >
                                                                        <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                                                                                {item.poster_image ? (
                                                                                        <img
                                                                                                src={typeof item.poster_image === 'object' ? item.poster_image?.value : item.poster_image}
                                                                                                alt={typeof item.title === 'object' ? item.title?.value : item.title}
                                                                                                className="w-full h-full object-cover object-center"
                                                                                                loading="lazy"
                                                                                                style={{ imageRendering: 'high-quality' }}
                                                                                        />
                                                                                ) : (
                                                                                        <div className="w-full h-full bg-card/60 flex items-center justify-center">
                                                                                                <History size={32} className="text-muted" />
                                                                                        </div>
                                                                                )}
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                                                                <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                                                                                        <p className="text-[11px] sm:text-xs font-bold text-white line-clamp-2 leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-1">
                                                                                                {(() => {
                                                                                                        const sName = typeof item.series_name === 'object' ? item.series_name?.value : item.series_name;
                                                                                                        const mName = typeof item.movie_name === 'object' ? item.movie_name?.value : item.movie_name;
                                                                                                        const title = typeof item.title === 'object' ? item.title?.value : item.title;
                                                                                                        return sName || mName || title || 'Unknown Title';
                                                                                                })()}
                                                                                        </p>
                                                                                        <div className="flex items-center justify-between">
                                                                                                {(item.episode_number || item.season_number) && (
                                                                                                        <p className="text-[10px] text-primary font-black drop-shadow-sm">
                                                                                                                S{typeof item.season_number === 'object' ? (item.season_number?.value || '1') : (item.season_number || '1')} E{typeof item.episode_number === 'object' ? item.episode_number?.value : item.episode_number}
                                                                                                        </p>
                                                                                                )}
                                                                                                {item.watched_at && (
                                                                                                        <p className="text-[9px] text-white/80 font-bold drop-shadow-sm">
                                                                                                                {new Date(item.watched_at).toLocaleDateString()}
                                                                                                        </p>
                                                                                                )}
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                        )}

                        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4">
                        {latestEpisodes.length > 0 && !query.trim() && (
                                <>
                                        <div className="flex flex-col gap-4">
                                                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                        <Sparkles size={24} className="text-primary" />
                                                        Latest Episodes
                                                </h2>
                                                <div className="episode-scroll-container">
                                                        <div className="episode-scroll">
                                                                {latestEpisodes.slice(0, 9).map((ep) => (
                                                                        <div 
                                                                                key={`${ep.series}-S${ep.season}E${ep.episode}`} 
                                                                                className="episode-card-horizontal"
                                                                                onClick={() => handleEpisodeClick(ep)}
                                                                        >
                                                                                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                                                                                        {ep.thumbnail ? (
                                                                                                <img 
                                                                                                        src={ep.thumbnail} 
                                                                                                        alt={ep.title} 
                                                                                                        className="w-full h-full object-cover object-center"
                                                                                                        loading="lazy"
                                                                                                        style={{ imageRendering: 'high-quality' }}
                                                                                                />
                                                                                        ) : (
                                                                                                <div className="w-full h-full bg-card/60 flex items-center justify-center">
                                                                                                        <Sparkles size={32} className="text-muted" />
                                                                                                </div>
                                                                                        )}
                                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                                                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                                                                                <p className="text-[10px] sm:text-xs font-medium text-white truncate leading-tight">{ep.series}</p>
                                                                                                <p className="text-[9px] sm:text-[10px] text-primary mt-0.5">S{ep.season}E{ep.episode}</p>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </>
                        )}

                                <div className="flex flex-col gap-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                                {query.trim() ? (
                                                                        <>
                                                                                <Search size={24} className="text-primary" />
                                                                                Your Results
                                                                        </>
                                                                ) : (
                                                                        'Latest library updates'
                                                                )}
                                                        </h2>
                                                        {!query.trim() && (
                                                                <p className="text-sm text-muted">
                                                                        Sorted by filesystem mtime. Scraper saves appear here automatically.
                                                                </p>
                                                        )}
                                                </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                                <p className="text-xs text-muted font-semibold whitespace-nowrap">Genre:</p>
                                                <div className="filter-scroll-container flex-1 overflow-hidden">
                                                        <div className="filter-scroll flex gap-2">
                                                                {allGenres.map((tag) => (
                                                                        <button
                                                                                key={tag}
                                                                                type="button"
                                                                                onClick={() => setGenreFilter(tag)}
                                                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                                                                                        genreFilter === tag
                                                                                                ? 'bg-primary/20 text-primary'
                                                                                                : 'bg-card text-muted hover:text-primary'
                                                                                }`}
                                                                        >
                                                                                {tag}
                                                                        </button>
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                                <p className="text-xs text-muted font-semibold whitespace-nowrap">Letter:</p>
                                                <div className="filter-scroll-container flex-1 overflow-hidden">
                                                        <div className="filter-scroll flex gap-2">
                                                                <button
                                                                        type="button"
                                                                        onClick={() => setLetterFilter('All')}
                                                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                                                                                letterFilter === 'All'
                                                                                        ? 'bg-primary/20 text-primary'
                                                                                        : 'bg-card text-muted hover:text-primary'
                                                                        }`}
                                                                >
                                                                        All
                                                                </button>
                                                                {ALPHABET.map((letter) => (
                                                                        <button
                                                                                key={letter}
                                                                                type="button"
                                                                                onClick={() => setLetterFilter(letter)}
                                                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                                                                                        letterFilter === letter
                                                                                                ? 'bg-primary/20 text-primary'
                                                                                                : 'bg-card text-muted hover:text-primary'
                                                                                }`}
                                                                        >
                                                                                {letter}
                                                                        </button>
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                {loading ? (
                                        <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                {Array.from({ length: 15 }).map((_, index) => (
                                                        <SkeletonCard key={index} />
                                                ))}
                                        </div>
                                ) : error ? (
                                        <div className="rounded-3xl bg-card/60 p-10 text-center text-muted">
                                                <p>{error}</p>
                                        </div>
                                ) : filteredSeries.length === 0 ? (
                                        <div className="rounded-3xl bg-card/60 p-10 text-center text-muted">
                                                <p>No titles matched your filters. Try adjusting the search or genre.</p>
                                        </div>
                                ) : (
                                        <>
                                                <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                        {paginatedSeries.map((item) => (
                                                                <SeriesCard
                                                                        key={item.slug}
                                                                        series={{
                                                                                slug: item.slug,
                                                                                title: item.title,
                                                                                poster: item.poster || '/placeholder.jpg',
                                                                                genres: item.genres || [],
                                                                                type: item.type,
                                                                                rating: item.rating
                                                                        }}
                                                                />
                                                        ))}
                                                </div>

                                                {totalPages > 1 && (
                                                        <div className="flex items-center justify-center gap-4">
                                                                <button
                                                                        type="button"
                                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                                        disabled={currentPage === 1}
                                                                        className="flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                        <ChevronLeft size={16} />
                                                                        Previous
                                                                </button>
                                                                <div className="flex items-center gap-2">
                                                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                                                let pageNum;
                                                                                if (totalPages <= 5) {
                                                                                        pageNum = i + 1;
                                                                                } else if (currentPage <= 3) {
                                                                                        pageNum = i + 1;
                                                                                } else if (currentPage >= totalPages - 2) {
                                                                                        pageNum = totalPages - 4 + i;
                                                                                } else {
                                                                                        pageNum = currentPage - 2 + i;
                                                                                }
                                                                                return (
                                                                                        <button
                                                                                                key={pageNum}
                                                                                                type="button"
                                                                                                onClick={() => handlePageChange(pageNum)}
                                                                                                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                                                                                        currentPage === pageNum
                                                                                                                ? 'bg-primary text-white'
                                                                                                                : 'bg-card text-muted hover:text-primary'
                                                                                                }`}
                                                                                        >
                                                                                                {pageNum}
                                                                                        </button>
                                                                                );
                                                                        })}
                                                                </div>
                                                                <button
                                                                        type="button"
                                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                                        disabled={currentPage === totalPages}
                                                                        className="flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                        Next
                                                                        <ChevronRight size={16} />
                                                                </button>
                                                        </div>
                                                )}

                                                <div className="text-center text-sm text-muted">
                                                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSeries.length)} of {filteredSeries.length} anime
                                                </div>
                                        </>
                                )}
                        </div>

                        {/* Random Anime Series Section */}
                        {randomSeries.length > 0 && !query.trim() && (
                                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4">
                                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                <Sparkles size={24} className="text-primary" />
                                                Random Anime Series
                                        </h2>
                                        <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                {randomSeries.map((item) => (
                                                        <SeriesCard
                                                                key={item.slug}
                                                                series={{
                                                                        slug: item.slug,
                                                                        title: item.title,
                                                                        poster: item.poster || '/placeholder.jpg',
                                                                        genres: item.genres || [],
                                                                        type: item.type,
                                                                        rating: item.rating
                                                                }}
                                                        />
                                                ))}
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                        )}

                        {/* Movies Section */}
                        {randomMovies.length > 0 && !query.trim() && (
                                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4">
                                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                <Flame size={24} className="text-primary" />
                                                Movies
                                        </h2>
                                        <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                {randomMovies.map((item) => (
                                                        <SeriesCard
                                                                key={item.slug}
                                                                series={{
                                                                        slug: item.slug,
                                                                        title: item.title,
                                                                        poster: item.poster || '/placeholder.jpg',
                                                                        genres: item.genres || [],
                                                                        type: item.type,
                                                                        rating: item.rating
                                                                }}
                                                        />
                                                ))}
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                        )}

                        {/* Random Mixed Section */}
                        {randomMixed.length > 0 && !query.trim() && (
                                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4">
                                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                <Sparkles size={24} className="text-primary" />
                                                Recommended For You
                                        </h2>
                                        <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                {randomMixed.map((item) => (
                                                        <SeriesCard
                                                                key={item.slug}
                                                                series={{
                                                                        slug: item.slug,
                                                                        title: item.title,
                                                                        poster: item.poster || '/placeholder.jpg',
                                                                        genres: item.genres || [],
                                                                        type: item.type,
                                                                        rating: item.rating
                                                                }}
                                                        />
                                                ))}
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                        )}

                        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4">
                                <div className="glass-surface rounded-3xl border border-white/5 p-8">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div>
                                                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                                                <Sparkles size={18} />
                                                                Trending in your archive
                                                        </h3>
                                                        <p className="text-sm text-muted">
                                                                Displaying the freshest four directories. Keep the watcher running to populate more.
                                                        </p>
                                                </div>
                                                <button
                                                        type="button"
                                                        className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:text-primary"
                                                >
                                                        View all
                                                </button>
                                        </div>

                                        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                                                {(trending.length ? trending : filteredSeries.slice(0, 4)).map((item) => (
                                                        <div
                                                                key={item.slug}
                                                                className="card-hover min-w-[220px] rounded-2xl bg-card p-4 text-sm text-muted/80"
                                                        >
                                                                <p className="text-xs text-muted">
                                                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                                                                </p>
                                                                <h4 className="mt-1 text-base font-semibold text-white">{item.title}</h4>
                                                                <p className="text-xs uppercase text-muted">
                                                                        {item.type === 'movie' ? 'Movie' : 'Series'}
                                                                </p>
                                                                <p className="mt-3 line-clamp-3 text-xs text-muted">
                                                                        {item.synopsis || 'Synopsis unavailable.'}
                                                                </p>
                                                        </div>
                                                ))}
                                        </div>
                                </div>
                        </div>
                </section>
        );
}

export default Home;
